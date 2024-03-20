import {
    ChatCompletionHandler,
    ChatCompletionResponse,
    LanguageModel,
    RequestError,
} from "./chat"
import { PromptNode, visitNode } from "./promptdom"
import wrapFetch from "fetch-retry"
import { logError, logVerbose } from "./util"
import { AICI_CONTROLLER, TOOL_ID } from "./constants"
import { host } from "./host"
import { NotSupportedError } from "./error"
import { ChatCompletionContentPartText } from "openai/resources"

function renderAICINode(node: AICINode) {
    const { type, name } = node
    switch (name) {
        case "gen":
            return `await gen(${JSON.stringify((node as AICIGenNode).options)})`
        default:
            return "undefined"
    }
}

function escapeJavascriptString(s: string) {
    return s.replace(/`/g, "\\`")
}

export interface AICIRequest {
    role: "aici"
    content?: string
    error?: unknown
    functionName: string
}

export async function renderAICI(
    functionName: string,
    root: PromptNode
): Promise<AICIRequest> {
    const notSupported = (reason: string) => (n: any) => {
        throw new NotSupportedError(reason)
    }

    let program: string[] = []
    let indent: string = ""
    const push = (text: string) => program.push(indent + text)

    push(`async function ${functionName}() {`)
    indent = "  "
    await visitNode(root, {
        text: async (n) => {
            const value = await n.value
            if (value !== undefined)
                // TODO escape javascript string to `...`
                push(`await fixed(\`${escapeJavascriptString(value)}\``)
        },
        stringTemplate: async (n) => {
            const { strings, args } = n
            let r = "await $`"
            for (let i = 0; i < strings.length; ++i) {
                r += escapeJavascriptString(strings[i])
                if (i < args.length) {
                    const arg = await args[i]
                    if (typeof arg === "string") {
                        r += escapeJavascriptString(arg)
                    } else if (arg.type === "aici") {
                        const rarg = renderAICINode(arg)
                        r += "${" + rarg + "}"
                    } else {
                        const rarg = JSON.stringify(arg)
                        r += "${" + rarg + "}"
                    }
                }
            }
            r += "`"
            push(r)
        },
        image: notSupported("image"),
        function: notSupported("function"),
        // TODO?
        schema: notSupported("schema"),
        // ignore
        // outputProcessor,
        // fileMerge,
    })

    indent = ""
    push("}")

    const content = program.join("\n")
    return { role: "aici", content, functionName }
}

interface ModelInitialRun {
    id: string
    object: "initial-run"
    created: number
    model: string
}

interface ModelRun {
    object: "run"
    forks: {
        index: number
        text: string
        error?: string
        logs?: string
        finish_reason?: "aici_stop"
        //"storage"?:
    }[]
    usage: {
        sampled_tokens: number
        ff_tokens: number
        cost: number
    }
}

type ModelMessage = ModelInitialRun | ModelRun

const AICIChatCompletion: ChatCompletionHandler = async (
    req,
    connection,
    options
) => {
    const { messages, temperature, top_p, seed, response_format, tools } = req
    const { url, token } = connection
    const { requestOptions, partialCb, retry, retryDelay, maxDelay, trace } =
        options
    const { signal } = requestOptions || {}
    const { headers, ...rest } = requestOptions || {}

    if (tools?.length) throw new NotSupportedError("AICI: tools not supported")
    if (response_format)
        throw new NotSupportedError("AICI: response_format not supported")

    let source: string[] = []
    let main: string[] = ["async function main() {"]
    messages.forEach((message, msgi) => {
        const { role, content } = message
        switch (role) {
            case "system":
            case "user": {
                const functionName = `${role}${msgi}`
                const functionSource = `async function ${functionName}() {
    $\`${escapeJavascriptString(
        typeof content === "string"
            ? content
            : content
                  .filter(({ type }) => type === "text")
                  .map((p) => (p as ChatCompletionContentPartText).text)
                  .join("\n")
    )}\`
}
`
                source.push(functionSource)
                main.push(`  await ${functionName}()`)
                break
            }
            case "aici": {
                const { functionName, content } = message
                main.push(`  await ${functionName}()`)
                source.push(content)
                source.push("")
                break
            }
            default:
                throw new NotSupportedError(
                    `AICI: message ${role} not supported`
                )
        }
    })
    main.push("}")

    source.push(...main)
    source.push(`start(main)`)

    const controller_arg = source.join("\n")

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

    const postReq = {
        controller: AICI_CONTROLLER,
        controller_arg,
    }

    trace.itemValue(`url`, url)
    trace.itemValue(`controller`, postReq.controller)
    trace.detailsFenced(`controller args`, postReq.controller_arg, "js")

    const r = await fetchRetry(url, {
        headers: {
            "api-key": token,
            "user-agent": TOOL_ID,
            "content-type": "application/json",
            ...(headers || {}),
        },
        body: JSON.stringify(postReq),
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

    let numTokens = 0
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
        return { text: chatResp, finishReason }
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
                const obj: ModelMessage = JSON.parse(json)
                switch (obj.object) {
                    case "initial-run": // ignore
                        break
                    case "run":
                        const content = obj.forks[0].text
                        numTokens = obj.usage.ff_tokens
                        chatResp += content
                        if (obj.forks[0].finish_reason === "aici_stop") {
                            finishReason = "stop"
                            seenDone = true
                        }

                        break
                    default: // unknown
                        break
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

export const AICIModel = Object.freeze<LanguageModel>({
    completer: AICIChatCompletion,
    id: "aici",
})
