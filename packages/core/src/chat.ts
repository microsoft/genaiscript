import type {
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
    CreateChatCompletionResponseChoicesInner,
} from "openai"
import { Cache } from "./cache"
import { initToken } from "./oai_token"
import { delay, logError, logVerbose } from "./util"
import { host } from "./host"

let testMode = false

interface Choice extends CreateChatCompletionResponseChoicesInner {
    delta: {
        content: string
    }
}

function getCache() {
    return Cache.byName<CreateChatCompletionRequest, string>("openai")
}

export interface ChatCompletionsProgressReport {
    tokensSoFar: number
    responseSoFar: string
}

export type ChatCompletionsOptions = {
    partialCb?: (progres: ChatCompletionsProgressReport) => void
    requestOptions?: Partial<RequestInit>
}

export class RequestError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        readonly retryAfter: number
    ) {
        super(
            `OpenAI error (${status}): ${statusText}${
                !isNaN(retryAfter) ? `, retry in ${retryAfter}s` : ""
            }`
        )
    }
}

export async function getChatCompletions(
    req: CreateChatCompletionRequest,
    options?: ChatCompletionsOptions
) {
    const { requestOptions, partialCb } = options || {}
    const { headers, ...rest } = requestOptions || {}
    const cache = getCache()
    const cached = testMode ? "Test-mode enabled" : await cache.get(req)
    if (cached !== undefined) {
        await delay(1000) // artificial delay for UI testing
        partialCb?.({
            tokensSoFar: Math.round(cached.length / 4),
            responseSoFar: cached,
        })
        return cached
    }

    const cfg = await initToken()
    const r2 = { ...req }
    delete r2.model
    r2.stream = true
    let numTokens = 0

    logVerbose(`query ${req.model}`)

    const r = await fetch(
        cfg.url +
            req.model +
            "/chat/completions?api-version=2023-03-15-preview",
        {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                authorization: `bearer ${cfg.token}`,
                "content-type": "application/json",
                "openai-internal-allowanyoutput": "1",
                "openai-internal-allowchatcompletion": "true",
                "openai-internal-allowedspecialtokens":
                    "<|im_start|>,<|im_sep|>,<|im_end|>",
                "x-ms-useragent": "AzureOpenAI.Studio/1.0.02313.522",
                Referer: "https://oai.azure.com/",
                ...(headers || {}),
            },
            body: JSON.stringify(r2),
            method: "POST",
            ...(rest || {}),
        }
    )

    if (r.status != 200)
        throw new RequestError(
            r.status,
            r.statusText,
            parseInt(r.headers.get("retry-after"))
        )

    let seenDone = false
    let chatResp = ""

    let pref = ""

    const decoder = host.createUTF8Decoder()

    if (r.body.getReader) {
        const reader = r.body.getReader()
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            doChunk(value)
        }
    } else {
        for await (const value of r.body as any) doChunk(value)
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
