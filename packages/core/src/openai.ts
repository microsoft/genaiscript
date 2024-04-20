import { logError, logVerbose } from "./util"
import { host } from "./host"
import {
    AZURE_OPENAI_API_VERSION,
    MAX_CACHED_TEMPERATURE,
    MAX_CACHED_TOP_P,
    TOOL_ID,
} from "./constants"
import { estimateTokens } from "./tokens"
import { YAMLStringify } from "./yaml"
import {
    ChatCompletionChunk,
    ChatCompletionHandler,
    ChatCompletionResponse,
    ChatCompletionToolCall,
    LanguageModel,
    getChatCompletionCache,
} from "./chat"
import { RequestError } from "./error"
import { createFetch } from "./fetch"

const OpenAIChatCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options
) => {
    const { temperature, top_p, seed, response_format, tools } = req
    const {
        requestOptions,
        partialCb,
        maxCachedTemperature = MAX_CACHED_TEMPERATURE,
        maxCachedTopP = MAX_CACHED_TOP_P,
        cache: useCache,
        retry,
        retryDelay,
        maxDelay,
        trace,
    } = options
    const { signal } = requestOptions || {}
    const { headers, ...rest } = requestOptions || {}
    const { token, source, ...cfgNoToken } = cfg
    let model = req.model.replace("-35-", "-3.5-")

    trace.itemValue(`temperature`, temperature)
    trace.itemValue(`top_p`, top_p)
    trace.itemValue(`seed`, seed)
    trace.itemValue(`api type`, cfg.type)

    const cache = getChatCompletionCache()
    const caching =
        useCache === true || // always cache
        (useCache !== false &&
            (isNaN(temperature) ||
                isNaN(maxCachedTemperature) ||
                temperature < maxCachedTemperature) && // high temperature is not cacheable (it's too random)
            (isNaN(top_p) || isNaN(maxCachedTopP) || top_p < maxCachedTopP) && // high top_p is not cacheable (it's too random)
            seed === undefined && // seed is not cacheable (let the LLM make the run determinsistic)
            !tools?.length)
    trace.itemValue(`caching`, caching)
    const cachedKey = caching ? { ...req, ...cfgNoToken } : undefined
    const cached = cachedKey ? await cache.get(cachedKey) : undefined
    if (cached !== undefined) {
        partialCb?.({
            tokensSoFar: estimateTokens(model, cached),
            responseSoFar: cached,
            responseChunk: cached,
        })
        trace.itemValue(`cached sha`, await cache.getKeySHA(cachedKey))
        return { text: cached, cached: true }
    }

    const r2 = { ...req }
    let postReq: any = r2

    let url = ""
    const toolCalls: ChatCompletionToolCall[] = []

    if (cfg.type === "openai" || cfg.type === "local") {
        r2.stream = true
        url = cfg.base + "/chat/completions"
    } else if (cfg.type === "azure") {
        r2.stream = true
        delete r2.model
        url =
            cfg.base +
            "/" +
            model.replace(/\./g, "") +
            `/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`
    } else throw new Error(`api type ${cfg.type} not supported`)

    trace.itemValue(`model`, model)
    trace.itemValue(`url`, `[${url}](${url})`)
    trace.itemValue(`response_format`, response_format)
    if (tools?.length) {
        trace.itemValue(
            `tools`,
            tools.map((t) => "`" + t.function.name + "`").join(", ")
        )
        trace.detailsFenced("🧱 schema", tools)
    }

    let numTokens = 0
    const fetchRetry = await createFetch({
        trace,
        retries: retry,
        retryDelay,
        maxDelay,
    })
    trace.dispatchChange()

    trace.detailsFenced("✉️ messages", postReq, "json")
    const body = JSON.stringify(postReq)
    const r = await fetchRetry(url, {
        headers: {
            // openai
            authorization:
                cfg.token && (cfg.type === "openai" || cfg.type === "local")
                    ? `Bearer ${cfg.token}`
                    : undefined,
            // azure
            "api-key":
                cfg.token && cfg.type === "azure" ? cfg.token : undefined,
            "user-agent": TOOL_ID,
            "content-type": "application/json",
            ...(headers || {}),
        },
        body,
        method: "POST",
        ...(rest || {}),
    })

    trace.itemValue(`response`, `${r.status} ${r.statusText}`)
    if (r.status !== 200) {
        trace.error(`request error: ${r.status}`)
        let body: string
        try {
            body = await r.text()
        } catch (e) {}
        let bodyJSON: { error: unknown }
        try {
            bodyJSON = body ? JSON.parse(body) : undefined
        } catch (e) {}
        throw new RequestError(
            r.status,
            r.statusText,
            bodyJSON?.error,
            body,
            parseInt(r.headers.get("retry-after"))
        )
    }

    let finishReason: ChatCompletionResponse["finishReason"] = undefined
    let seenDone = false
    let chatResp = ""

    let pref = ""

    const decoder = host.createUTF8Decoder()

    if (r.body.getReader) {
        const reader = r.body.getReader()
        while (!signal?.aborted) {
            const { done, value } = await reader.read()
            if (done) break
            doChunk(value)
        }
    } else {
        for await (const value of r.body as any) {
            if (signal?.aborted) break
            doChunk(value)
        }
    }

    if (seenDone) {
        if (cachedKey) {
            await cache.set(cachedKey, chatResp)
        }
        return { text: chatResp, toolCalls, finishReason }
    } else {
        trace.error(`invalid response`)
        trace.fence(pref)
        throw new Error(`invalid response: ${pref}`)
    }

    function doChunk(value: Uint8Array) {
        // Massage and parse the chunk of data
        let chunk = decoder.decode(value, { stream: true })

        chunk = pref + chunk
        const ch0 = chatResp
        chunk = chunk.replace(/^data:\s*(.*)[\r\n]+/gm, (_, json) => {
            if (json == "[DONE]") {
                seenDone = true
                return ""
            }
            if (seenDone) {
                logError(`tokens after done! '${json}'`)
                return ""
            }
            try {
                const obj: ChatCompletionChunk = JSON.parse(json)
                if (!obj.choices?.length) return ""
                else if (obj.choices?.length != 1) throw new Error()
                const choice = obj.choices[0]
                const { finish_reason, delta } = choice
                if (typeof delta?.content == "string") {
                    numTokens += estimateTokens(model, delta.content)
                    chatResp += delta.content
                } else if (delta?.tool_calls?.length) {
                    const { tool_calls } = delta
                    logVerbose(
                        `delta tool calls: ${JSON.stringify(tool_calls)}`
                    )
                    for (const call of tool_calls) {
                        const tc =
                            toolCalls[call.index] ||
                            (toolCalls[call.index] = {
                                id: call.id,
                                name: call.function.name,
                                arguments: "",
                            })
                        if (call.function.arguments)
                            tc.arguments += call.function.arguments
                    }
                } else if (finish_reason == "tool_calls") {
                    // apply tools and restart
                    finishReason = finish_reason
                    seenDone = true
                    logVerbose(`tool calls: ${JSON.stringify(toolCalls)}`)
                } else if (finish_reason === "length") {
                    finishReason = finish_reason
                    logVerbose(`response too long`)
                    trace.error(`response too long, increase maxTokens.`)
                } else if (finish_reason === "stop") {
                    finishReason = finish_reason
                    seenDone = true
                } else if (finish_reason) {
                    logVerbose(YAMLStringify(choice))
                }
            } catch {
                logError(`invalid json in chat response: ${json}`)
            }
            return ""
        })
        const progress = chatResp.slice(ch0.length)
        if (progress != "") {
            // logVerbose(`... ${progress.length} chars`);
            partialCb?.({
                responseSoFar: chatResp,
                tokensSoFar: numTokens,
                responseChunk: progress,
            })
        }
        pref = chunk
    }
}

export const OpenAIModel = Object.freeze<LanguageModel>({
    completer: OpenAIChatCompletion,
    id: "openai",
})
