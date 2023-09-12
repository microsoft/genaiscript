import type {
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
    CreateChatCompletionResponseChoicesInner,
    ModelError,
} from "openai"
import { Cache } from "./cache"
import { initToken } from "./oai_token"
import { delay, logError, logVerbose } from "./util"
import { host } from "./host"
import { MAX_CACHED_TEMPERATURE } from "./constants"

let testMode = false

interface Choice extends CreateChatCompletionResponseChoicesInner {
    delta: {
        content: string
    }
}

export function getChatCompletionCache() {
    return Cache.byName<CreateChatCompletionRequest, string>("openai")
}

export interface ChatCompletionsProgressReport {
    tokensSoFar: number
    responseSoFar: string
}

export type ChatCompletionsOptions = {
    partialCb?: (progres: ChatCompletionsProgressReport) => void
    requestOptions?: Partial<RequestInit>
    maxCachedTemperature?: number
}

export class RequestError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        public readonly body: ModelError,
        readonly retryAfter: number
    ) {
        super(
            `OpenAI error: ${body ? body.message : `${statusText} (${status})`}`
        )
    }
}

export async function getChatCompletions(
    req: CreateChatCompletionRequest,
    options?: ChatCompletionsOptions
) {
    const { temperature } = req
    const {
        requestOptions,
        partialCb,
        maxCachedTemperature = MAX_CACHED_TEMPERATURE,
    } = options || {}
    const { signal } = requestOptions || {}
    const { headers, ...rest } = requestOptions || {}
    const cache = getChatCompletionCache()
    const cached = testMode
        ? "Test-mode enabled"
        : temperature > maxCachedTemperature
        ? undefined
        : await cache.get(req)
    if (cached !== undefined) {
        partialCb?.({
            tokensSoFar: Math.round(cached.length / 4),
            responseSoFar: cached,
        })
        return cached
    }

    const cfg = await initToken()
    const r2 = { ...req }

    const model = req.model.replace("-35-", "-3.5-")

    let url = ""

    if (cfg.isOpenAI) {
        url = cfg.url + "/chat/completions"
    } else {
        delete r2.model
        url =
            cfg.url +
            model.replace(/\./g, "") +
            "/chat/completions?api-version=2023-03-15-preview"
    }

    r2.stream = true
    let numTokens = 0

    logVerbose(`query ${model} at ${url}`)

    const r = await fetch(url, {
        headers: {
            authorization: cfg.isOpenAI ? `Bearer ${cfg.token}` : undefined,
            "api-key": cfg.isOpenAI ? undefined : cfg.token,
            "user-agent": "coarch",
            "content-type": "application/json",
            ...(headers || {}),
        },
        body: JSON.stringify(r2),
        method: "POST",
        ...(rest || {}),
    })

    if (r.status != 200) {
        const b = (await r.json()) as { error: ModelError }
        const body = b?.error
        throw new RequestError(
            r.status,
            r.statusText,
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
        await cache.set(req, chatResp)
        return chatResp
    } else {
        throw new Error(`invalid response: ${pref}`)
    }

    function doChunk(value: Uint8Array) {
        // Massage and parse the chunk of data
        let chunk = decoder.decode(value, { stream: true })

        chunk = pref + chunk
        const ch0 = chatResp
        chunk = chunk.replace(/^data: (.*)[\r\n]+/gm, (_, json) => {
            if (json == "[DONE]") {
                seenDone = true
                return ""
            }
            if (seenDone) {
                logError(`tokens after done! '${json}'`)
                return ""
            }
            try {
                const obj: CreateChatCompletionResponse = JSON.parse(json)
                if (obj.choices?.length != 1) throw new Error()
                const ch = obj.choices[0] as Choice
                if (typeof ch?.delta?.content == "string") {
                    numTokens++
                    chatResp += ch.delta.content
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
            })
        }
        pref = chunk
    }
}
