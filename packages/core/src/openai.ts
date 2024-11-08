import { deleteUndefinedValues, normalizeInt, trimTrailingSlash } from "./util"
import { LanguageModelConfiguration, host } from "./host"
import {
    AZURE_AI_INFERENCE_VERSION,
    AZURE_OPENAI_API_VERSION,
    MODEL_PROVIDER_OPENAI,
    OPENROUTER_API_CHAT_URL,
    OPENROUTER_SITE_NAME_HEADER,
    OPENROUTER_SITE_URL_HEADER,
    TOOL_ID,
    TOOL_NAME,
    TOOL_URL,
} from "./constants"
import { estimateTokens } from "./tokens"
import { ChatCompletionHandler, LanguageModel, LanguageModelInfo } from "./chat"
import { RequestError, errorMessage, serializeError } from "./error"
import { createFetch, traceFetchPost } from "./fetch"
import { parseModelIdentifier } from "./models"
import { JSON5TryParse } from "./json5"
import {
    ChatCompletionRequestCacheKey,
    getChatCompletionCache,
} from "./chatcache"
import {
    ChatCompletionToolCall,
    ChatCompletionResponse,
    ChatCompletionChunk,
    ChatCompletionUsage,
    ChatCompletion,
    ChatCompletionChunkChoice,
    ChatCompletionChoice,
    CreateChatCompletionRequest,
    ChatCompletionTokenLogprob,
} from "./chattypes"
import { resolveTokenEncoder } from "./encoders"
import { toSignal } from "./cancellation"
import { INITryParse } from "./ini"

export function getConfigHeaders(cfg: LanguageModelConfiguration) {
    let { token, type, base } = cfg
    if (type === "azure_serverless_models") {
        const keys = INITryParse(token)
        if (keys && Object.keys(keys).length > 1) token = keys[cfg.model]
    }
    const isBearer = /^Bearer /i.test(cfg.token)
    const res: Record<string, string> = {
        // openai
        Authorization: isBearer
            ? token
            : token &&
                (type === "openai" ||
                    type === "localai" ||
                    type === "azure_serverless_models" ||
                    base === OPENROUTER_API_CHAT_URL)
              ? `Bearer ${token}`
              : undefined,
        // azure
        "api-key":
            token &&
            !isBearer &&
            (type === "azure" || type === "azure_serverless")
                ? token
                : undefined,
        "User-Agent": TOOL_ID,
    }
    deleteUndefinedValues(res)
    return res
}

export const OpenAIChatCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options,
    trace
) => {
    const {
        requestOptions,
        partialCb,
        cache: cacheOrName,
        cacheName,
        retry,
        retryDelay,
        maxDelay,
        cancellationToken,
        inner,
    } = options
    const { headers = {}, ...rest } = requestOptions || {}
    const { token, source, ...cfgNoToken } = cfg
    const { model } = parseModelIdentifier(req.model)
    const { encode: encoder } = await resolveTokenEncoder(model)

    const cache = !!cacheOrName || !!cacheName
    const cacheStore = getChatCompletionCache(
        typeof cacheOrName === "string" ? cacheOrName : cacheName
    )
    const cachedKey = cache
        ? <ChatCompletionRequestCacheKey>{
              ...req,
              ...cfgNoToken,
              model: req.model,
              temperature: req.temperature,
              top_p: req.top_p,
              max_tokens: req.max_tokens,
              logit_bias: req.logit_bias,
          }
        : undefined
    trace.itemValue(`caching`, cache)
    trace.itemValue(`cache`, cacheStore?.name)
    const { text: cached, finishReason: cachedFinishReason } =
        (await cacheStore.get(cachedKey)) || {}
    if (cached !== undefined) {
        partialCb?.({
            tokensSoFar: estimateTokens(cached, encoder),
            responseSoFar: cached,
            responseChunk: cached,
            inner,
        })
        trace.itemValue(`cache hit`, await cacheStore.getKeySHA(cachedKey))
        return { text: cached, finishReason: cachedFinishReason, cached: true }
    }

    const postReq = structuredClone({
        ...req,
        stream: true,
        stream_options: { include_usage: true },
        model,
    } satisfies CreateChatCompletionRequest)

    // stream_options fails in some cases
    if (model === "gpt-4-turbo-v" || /mistral/i.test(model)) {
        delete postReq.stream_options
    }
    if (/o1-(mini|preview)/i.test(model)) {
        delete postReq.temperature
        delete postReq.stream
        delete postReq.stream_options
        for (const msg of postReq.messages) {
            if (msg.role === "system") {
                ;(msg as any).role = "user"
            }
        }
    }
    if (
        postReq.messages.find(
            (msg) =>
                msg.role === "user" &&
                typeof msg.content !== "string" &&
                msg.content.some((c) => c.type === "image_url")
        )
    )
        delete postReq.stream_options // crash on usage computation

    let url = ""
    const toolCalls: ChatCompletionToolCall[] = []

    if (cfg.type === "openai" || cfg.type === "localai") {
        url = trimTrailingSlash(cfg.base) + "/chat/completions"
        if (url === OPENROUTER_API_CHAT_URL) {
            ;(headers as any)[OPENROUTER_SITE_URL_HEADER] =
                process.env.OPENROUTER_SITE_URL || TOOL_URL
            ;(headers as any)[OPENROUTER_SITE_NAME_HEADER] =
                process.env.OPENROUTER_SITE_NAME || TOOL_NAME
        }
    } else if (cfg.type === "azure") {
        delete postReq.model
        url =
            trimTrailingSlash(cfg.base) +
            "/" +
            model.replace(/\./g, "") +
            `/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`
    } else if (cfg.type === "azure_serverless_models") {
        url =
            trimTrailingSlash(cfg.base).replace(
                /^https?:\/\/(?<deployment>[^\.]+)\.(?<region>[^\.]+)\.models\.ai\.azure\.com/i,
                (m, deployment, region) =>
                    `https://${postReq.model}.${region}.models.ai.azure.com`
            ) + `/chat/completions?api-version=${AZURE_AI_INFERENCE_VERSION}`
        ;(headers as any)["extra-parameters"] = "pass-through"
        delete postReq.model
        delete postReq.stream_options
    } else if (cfg.type === "azure_serverless") {
        url =
            trimTrailingSlash(cfg.base) +
            "/" +
            model.replace(/\./g, "") +
            `/chat/completions?api-version=${AZURE_AI_INFERENCE_VERSION}`
        // https://learn.microsoft.com/en-us/azure/machine-learning/reference-model-inference-api?view=azureml-api-2&tabs=javascript#extensibility
        ;(headers as any)["extra-parameters"] = "pass-through"
        delete postReq.model
    } else throw new Error(`api type ${cfg.type} not supported`)

    trace.itemValue(`url`, `[${url}](${url})`)

    let numTokens = 0
    const fetchRetry = await createFetch({
        trace,
        retries: retry,
        retryDelay,
        maxDelay,
        cancellationToken,
    })
    trace.dispatchChange()

    const fetchHeaders: HeadersInit = {
        ...getConfigHeaders(cfg),
        "Content-Type": "application/json",
        ...(headers || {}),
    }
    traceFetchPost(trace, url, fetchHeaders as any, postReq)
    const body = JSON.stringify(postReq)
    let r: Response
    try {
        r = await fetchRetry(url, {
            headers: fetchHeaders,
            body,
            method: "POST",
            signal: toSignal(cancellationToken),
            ...(rest || {}),
        })
    } catch (e) {
        trace.error(errorMessage(e), e)
        throw e
    }

    trace.itemValue(`status`, `${r.status} ${r.statusText}`)
    if (r.status !== 200) {
        let responseBody: string
        try {
            responseBody = await r.text()
        } catch (e) {}
        trace.detailsFenced(`response`, responseBody, "json")
        const { error, message } = JSON5TryParse(responseBody, {}) as {
            error: any
            message: string
        }
        if (message) trace.error(message)
        if (error)
            trace.error(undefined, <SerializedError>{
                name: error.code,
                code: error.status,
                message: error.message,
            })
        throw new RequestError(
            r.status,
            message ??
                (typeof error === "string" ? error : undefined) ??
                error?.message ??
                r.statusText,
            error,
            responseBody,
            normalizeInt(r.headers.get("retry-after"))
        )
    }

    let done = false
    let finishReason: ChatCompletionResponse["finishReason"] = undefined
    let chatResp = ""
    let pref = ""
    let usage: ChatCompletionUsage
    let error: SerializedError
    let responseModel: string
    let lbs: ChatCompletionTokenLogprob[] = []

    const doChoices = (json: string, tokens: string[]) => {
        const obj: ChatCompletionChunk | ChatCompletion = JSON.parse(json)

        if (!postReq.stream) trace.detailsFenced(`response`, obj, "json")

        console.log(JSON.stringify(obj, null, 2))
        if (obj.usage) usage = obj.usage
        if (!responseModel && obj.model) responseModel = obj.model
        if (!obj.choices?.length) return
        else if (obj.choices?.length != 1)
            throw new Error("too many choices in response")
        const choice = obj.choices[0]
        const { finish_reason } = choice
        if (finish_reason) finishReason = finish_reason as any
        if ((choice as ChatCompletionChunkChoice).delta) {
            const { delta, logprobs } = choice as ChatCompletionChunkChoice
            if (logprobs?.content) lbs.push(...logprobs.content)
            if (typeof delta?.content === "string") {
                numTokens += estimateTokens(delta.content, encoder)
                chatResp += delta.content
                tokens.push(delta.content)
                trace.appendToken(delta.content)
            } else if (Array.isArray(delta.tool_calls)) {
                const { tool_calls } = delta
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
            }
        } else if ((choice as ChatCompletionChoice).message) {
            const { message } = choice as ChatCompletionChoice
            chatResp = message.content
            numTokens = usage?.total_tokens ?? estimateTokens(chatResp, encoder)
            partialCb?.({
                responseSoFar: chatResp,
                tokensSoFar: numTokens,
                responseChunk: chatResp,
                inner,
            })
        }

        if (
            finish_reason === "function_call" ||
            finish_reason === "tool_calls"
        ) {
            finishReason = "tool_calls"
        } else {
            finishReason = finish_reason
        }
    }

    if (!postReq.stream) {
        const responseBody = await r.text()
        doChoices(responseBody, [])
    } else {
        const decoder = host.createUTF8Decoder()
        const doChunk = (value: Uint8Array) => {
            // Massage and parse the chunk of data
            let tokens: string[] = []
            let chunk = decoder.decode(value, { stream: true })

            chunk = pref + chunk
            const ch0 = chatResp
            chunk = chunk.replace(/^data:\s*(.*)[\r\n]+/gm, (_, json) => {
                if (json === "[DONE]") {
                    done = true
                    return ""
                }
                try {
                    doChoices(json, tokens)
                } catch (e) {
                    trace.error(`error processing chunk`, e)
                }
                return ""
            })
            // end replace
            const progress = chatResp.slice(ch0.length)
            if (progress != "") {
                // logVerbose(`... ${progress.length} chars`);
                partialCb?.({
                    responseSoFar: chatResp,
                    tokensSoFar: numTokens,
                    responseChunk: progress,
                    responseTokens: tokens,
                    inner,
                })
            }
            pref = chunk
        }

        try {
            if (r.body.getReader) {
                const reader = r.body.getReader()
                while (!cancellationToken?.isCancellationRequested) {
                    const { done, value } = await reader.read()
                    if (done) break
                    doChunk(value)
                }
            } else {
                for await (const value of r.body as any) {
                    if (cancellationToken?.isCancellationRequested) break
                    doChunk(value)
                }
            }
            if (cancellationToken?.isCancellationRequested)
                finishReason = "cancel"
            finishReason = finishReason || "stop" // some provider do not implement this final mesage
        } catch (e) {
            finishReason = "fail"
            error = serializeError(e)
        }
    }

    trace.appendContent("\n\n")
    if (responseModel) trace.itemValue(`model`, responseModel)
    trace.itemValue(`🏁 finish reason`, finishReason)
    if (usage) {
        trace.itemValue(
            `🪙 tokens`,
            `${usage.total_tokens} total, ${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion`
        )
    }

    if (done && finishReason === "stop")
        await cacheStore.set(cachedKey, { text: chatResp, finishReason })
    return {
        text: chatResp,
        toolCalls,
        finishReason,
        usage,
        error,
        model: responseModel,
        logprobs: lbs,
    } satisfies ChatCompletionResponse
}

async function listModels(
    cfg: LanguageModelConfiguration
): Promise<LanguageModelInfo[]> {
    const fetch = await createFetch()
    const res = await fetch(cfg.base + "/models", {
        method: "GET",
        headers: {
            ...getConfigHeaders(cfg),
            Accept: "application/json",
        },
    })
    if (res.status !== 200) return []
    const { data } = (await res.json()) as {
        object: "list"
        data: {
            id: string
            object: "model"
            created: number
            owned_by: string
        }[]
    }
    return data.map(
        (m) =>
            <LanguageModelInfo>{
                id: m.id,
                details: `${m.id}, ${m.owned_by}`,
            }
    )
}

export const OpenAIModel = Object.freeze<LanguageModel>({
    completer: OpenAIChatCompletion,
    id: MODEL_PROVIDER_OPENAI,
    listModels,
})
