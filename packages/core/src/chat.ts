import OpenAI from "openai"
import { Cache } from "./cache"
import { initToken } from "./oai_token"
import { logError, logVerbose } from "./util"
import { host } from "./host"
import { AZURE_OPENAI_API_VERSION, MAX_CACHED_TEMPERATURE } from "./constants"
import wrapFetch from "fetch-retry"
import { MarkdownTrace } from "./trace"

export type CreateChatCompletionRequest =
    OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming

export type ChatCompletionRequestMessage =
    OpenAI.Chat.Completions.ChatCompletionMessageParam

export interface ChatCompletionToolCall {
    id: string
    name: string
    arguments?: string
}

export interface ChatCompletionResponse {
    text?: string
    toolCalls?: ChatCompletionToolCall[]
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
    const { temperature, seed, response_format, tools } = req
    const {
        requestOptions,
        partialCb,
        maxCachedTemperature = MAX_CACHED_TEMPERATURE,
        cache: useCache,
        retry,
        retryDelay,
        maxDelay,
        trace,
    } = options
    const { signal } = requestOptions || {}
    const { headers, ...rest } = requestOptions || {}
    const cache = getChatCompletionCache()
    const caching =
        useCache &&
        temperature > maxCachedTemperature &&
        seed === undefined &&
        !tools?.length
    const cached = caching ? await cache.get(req) : undefined
    if (cached !== undefined) {
        partialCb?.({
            tokensSoFar: Math.round(cached.length / 4),
            responseSoFar: cached,
            responseChunk: cached,
        })
        trace.item(`found cached response`)
        return { text: cached }
    }

    const cfg = await initToken()
    const r2 = { ...req }
    let postReq: any = r2

    let model = req.model.replace("-35-", "-3.5-")
    let url = ""
    const toolCalls: ChatCompletionToolCall[] = []

    if (cfg.isTGI) {
        model = "TGI-model"
        url = cfg.url + "/generate_stream"
        postReq = {
            parameters: {
                temperature: req.temperature,
                return_full_text: false,
                max_new_tokens: req.max_tokens,
                seed: req.seed,
            },
            inputs: encodeMessagesForLlama(req),
        }
    } else if (cfg.isOpenAI) {
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

    trace.item(`${cfg.isTGI ? "TGI" : "OpenAI"} chat request`)
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
        trace.startDetails("schema")
        trace.fence(JSON.stringify(tools, null, 2), "json")
        trace.endDetails()
    }

    let numTokens = 0

    const fetchRetry = await wrapFetch(fetch, {
        retryOn: [429],
        retries: retry,
        retryDelay: (attempt, error, response) => {
            const delay = Math.min(maxDelay, Math.pow(2, attempt) * retryDelay)
            if (attempt > 0) {
                trace.item(`retry #${attempt} after ${delay}ms`)
                logVerbose(
                    `LLM throttled, retry #${attempt} in ${
                        (delay / 1000) | 0
                    }s...`
                )
            }
            return delay
        },
    })
    const r = await fetchRetry(url, {
        headers: {
            authorization:
                cfg.token && cfg.isOpenAI ? `Bearer ${cfg.token}` : undefined,
            "api-key": cfg.token && !cfg.isOpenAI ? cfg.token : undefined,
            "user-agent": "gptools",
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
        if (caching && !cfg.isTGI) await cache.set(req, chatResp)
        return { text: chatResp, toolCalls }
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
            if (cfg.isTGI)
                try {
                    const obj: TGIResponse = JSON.parse(json)
                    if (typeof obj.token.text == "string") {
                        numTokens++
                        chatResp += obj.token.text
                    }
                    if (obj.generated_text != null) seenDone = true
                } catch {
                    logError(`invalid json in chat response: ${json}`)
                }
            else
                try {
                    const obj: OpenAI.ChatCompletionChunk = JSON.parse(json)
                    if (obj.choices?.length != 1) throw new Error()
                    const choice = obj.choices[0]
                    const { finish_reason, delta } = choice
                    if (typeof delta?.content == "string") {
                        numTokens++
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
                        seenDone = true
                        logVerbose(`tool calls: ${JSON.stringify(toolCalls)}`)
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
