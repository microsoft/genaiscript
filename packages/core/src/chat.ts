import OpenAI from "openai"
import { Cache } from "./cache"
import { initToken } from "./oai_token"
import { logError, logVerbose } from "./util"
import { host } from "./host"
import {
    AZURE_OPENAI_API_VERSION,
    MAX_CACHED_TEMPERATURE,
    MAX_CACHED_TOP_P,
    TOOL_ID,
} from "./constants"
import wrapFetch from "fetch-retry"
import { MarkdownTrace } from "./trace"
import { estimateTokens } from "./tokens"
import { YAMLStringify } from "./yaml"
import { ChatCompletionUserMessageParam } from "openai/resources"
import { PromptImage } from "./promptdom"

export type CreateChatCompletionRequest =
    OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming

export type ChatCompletionRequestMessage =
    OpenAI.Chat.Completions.ChatCompletionMessageParam

export type ChatCompletionContentPartImage =
    OpenAI.Chat.Completions.ChatCompletionContentPartImage

export interface ChatCompletionToolCall {
    id: string
    name: string
    arguments?: string
}

export interface ChatCompletionResponse {
    text?: string
    toolCalls?: ChatCompletionToolCall[]
    finishReason?: "stop" | "length" | "tool_calls" | "content_filter" | "cancel"
}

export const ModelError = OpenAI.APIError

export function getChatCompletionCache() {
    return Cache.byName<CreateChatCompletionRequest, string>("openai")
}

export interface ChatCompletionsProgressReport {
    tokensSoFar: number
    responseSoFar: string
    responseChunk: string
}

export interface ChatCompletionsOptions {
    partialCb?: (progres: ChatCompletionsProgressReport) => void
    requestOptions?: Partial<RequestInit>
    maxCachedTemperature?: number
    maxCachedTopP?: number
    cache?: boolean
    retry?: number
    retryDelay?: number
    maxDelay?: number
}

export class RequestError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        public readonly body: any,
        public readonly bodyText: string,
        readonly retryAfter: number
    ) {
        super(
            `OpenAI error: ${
                body?.message ? body?.message : `${statusText} (${status})`
            }`
        )
    }
}

export function toChatCompletionUserMessage(
    expanded: string,
    images?: PromptImage[]
) {
    return <ChatCompletionUserMessageParam>{
        role: "user",
        content: [
            {
                type: "text",
                text: expanded,
            },
            ...(images || []).map(
                ({ url, detail }) =>
                    <ChatCompletionContentPartImage>{
                        type: "image_url",
                        image_url: {
                            url,
                            detail,
                        },
                    }
            ),
        ],
    }
}

function encodeMessagesForLlama(req: CreateChatCompletionRequest) {
    return (
        req.messages
            .map((msg) => {
                switch (msg.role) {
                    case "user":
                        return `[INST]\n${msg.content}\n[/INST]`
                    case "system":
                        return `[INST] <<SYS>>\n${msg.content}\n<</SYS>>\n[/INST]`
                    case "assistant":
                        return msg.content
                    case "function":
                        return "???function"
                    default:
                        return "???role " + msg.role
                }
            })
            .join("\n")
            .replace(/\[\/INST\]\n\[INST\]/g, "\n") + "\n"
    )
}

interface TGIResponse {
    token: {
        id: number
        text: string
        logprob: number
        special: boolean
    }
    generated_text: string | null
}

export async function getChatCompletions(
    req: CreateChatCompletionRequest,
    options: ChatCompletionsOptions & { trace: MarkdownTrace }
): Promise<ChatCompletionResponse> {
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
    let model = req.model.replace("-35-", "-3.5-")

    trace.item(
        `temperature: ${temperature} (max cached: ${maxCachedTemperature})`
    )
    trace.item(`top_p: ${top_p} (max cached: ${maxCachedTopP})`)
    if (seed) trace.item(`seed: ${seed}`)

    const cache = getChatCompletionCache()
    const caching =
        useCache &&
        (isNaN(maxCachedTemperature) || temperature < maxCachedTemperature) && // high temperature is not cacheable (it's too random)
        (isNaN(maxCachedTopP) || top_p < maxCachedTopP) && // high top_p is not cacheable (it's too random)
        seed === undefined && // seed is not cacheable (let the LLM make the run determinsistic)
        !tools?.length
    const cached = caching ? await cache.get(req) : undefined
    if (cached !== undefined) {
        partialCb?.({
            tokensSoFar: estimateTokens(model, cached),
            responseSoFar: cached,
            responseChunk: cached,
        })
        trace.item(`found cached response ${await cache.getKeySHA(req)}`)
        return { text: cached }
    }

    const cfg = await initToken()
    const r2 = { ...req }
    let postReq: any = r2

    let url = ""
    const toolCalls: ChatCompletionToolCall[] = []

    if (cfg.isOpenAI) {
        r2.stream = true
        url = cfg.url + "/chat/completions"
    } else {
        r2.stream = true
        delete r2.model
        url =
            cfg.url +
            model.replace(/\./g, "") +
            `/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`
    }

    trace.item(`model: ${model}`)
    trace.item(`url: [${url}](${url})`)
    if (response_format)
        trace.item(
            `response_format: ${JSON.stringify(response_format, null, 2)}`
        )
    if (tools?.length) {
        trace.item(
            `tools: ${tools.map((t) => "`" + t.function.name + "`").join(", ")}`
        )
        trace.detailsFenced("🧱 schema", tools)
    }

    let numTokens = 0

    const fetchRetry = await wrapFetch(fetch, {
        retryOn: [429, 500],
        retries: retry,
        retryDelay: (attempt, error, response) => {
            if (attempt > 0) {
                trace.item(`retry #${attempt}`)
                logVerbose(`LLM throttled, retry #${attempt}...`)
            }
            return 0
        },
    })

    trace.dispatchChange()
    const r = await fetchRetry(url, {
        headers: {
            authorization:
                cfg.token && cfg.isOpenAI ? `Bearer ${cfg.token}` : undefined,
            "api-key": cfg.token && !cfg.isOpenAI ? cfg.token : undefined,
            "user-agent": TOOL_ID,
            "content-type": "application/json",
            ...(headers || {}),
        },
        body: JSON.stringify(postReq),
        method: "POST",
        ...(rest || {}),
    })

    trace.item(`response: ${r.status} ${r.statusText}`)
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
        if (caching) await cache.set(req, chatResp)
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
                const obj: OpenAI.ChatCompletionChunk = JSON.parse(json)
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
                } else {
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
