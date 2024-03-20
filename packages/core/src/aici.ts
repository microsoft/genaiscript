import {
    ChatCompletionHandler,
    ChatCompletionResponse,
    LanguageModel,
} from "./chat"
import { PromptNode, visitNode } from "./promptdom"
import { MarkdownTrace } from "./trace"
import wrapFetch from "fetch-retry"
import { logVerbose } from "./util"
import { AICI_CONTROLLER, TOOL_ID } from "./constants"
import { initToken } from "./oai_token"

export class NotSupportedError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message)
        this.name = "NotSupportedError"
    }
}

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
    functionName?: string
}

export async function renderAICI(
    root: PromptNode,
    options?: { trace: MarkdownTrace; functionName?: string }
): Promise<AICIRequest> {
    const { trace, functionName = "prompt" } = options
    const notSupported = (reason: string) => (n: any) => {
        throw new NotSupportedError(reason)
    }

    try {
        trace?.startDetails("aici")
        trace?.itemValue("controller", "jsctrl")
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

        trace?.fence(content, "javascript")

        return { role: "aici", content, functionName }
    } catch (error) {
        trace?.error("AICI code generation error", error)
        throw error
    } finally {
        trace?.endDetails()
    }
}

const AICIChatCompletion: ChatCompletionHandler = async (req, options) => {
    const { messages, temperature, top_p, seed, response_format, tools } = req
    const { requestOptions, partialCb, retry, retryDelay, maxDelay, trace } =
        options
    const { signal } = requestOptions || {}
    const { headers, ...rest } = requestOptions || {}

    if (tools?.length) throw new NotSupportedError("AICI: tools not supported")
    if (response_format)
        throw new NotSupportedError("AICI: response_format not supported")

    let source: string[] = []

    let main: string[] = ["async function main() {"]
    messages.forEach((message) => {
        const { role } = message
        switch (role) {
            case "aici": {
                const { functionName, content } = message
                main.push(`await ${functionName}()`)
                source.push(content)
                source.push("")
                break
            }
            default:
                // TODO
                throw new NotSupportedError("AICI: only aici messages")
        }
    })
    main.push("}")

    source.push(...main)
    source.push(`start(main)`)

    const controller_arg = source.join("\n")

    trace.detailsFenced(`controller args`, controller_arg)

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

    const tok = await initToken()
    const url = tok.url
    const token = tok.token

    const postReq = {
        controller: AICI_CONTROLLER,
        controller_arg,
    }

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

    return <ChatCompletionResponse>{
        text: "aici bla bla ",
    }
}

export const AICIModel = Object.freeze<LanguageModel>({
    completer: AICIChatCompletion,
    id: "aici",
})
