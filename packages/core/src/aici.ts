// AICI Language Model Implementation
// Provides functionalities for rendering AICI scripts and handling chat completions within the application.
// It includes various utilities, constants, and error handling specific to the AICI model.

import { ChatCompletionHandler, LanguageModel, LanguageModelInfo } from "./chat"
import { PromptNode, visitNode } from "./promptdom"
import { fromHex, logError, normalizeInt, utf8Decode } from "./util"
import { AICI_CONTROLLER, TOOL_ID } from "./constants"
import { LanguageModelConfiguration, host } from "./host"
import { NotSupportedError, RequestError } from "./error"
import { createFetch } from "./fetch"
import { parseModelIdentifier } from "./models"
import {
    AICIRequest,
    ChatCompletionContentPartText,
    ChatCompletionResponse,
} from "./chattypes"

/**
 * Renders an AICI node into a string representation.
 * Handles different node types and constructs appropriate string output.
 * @param node - The AICI node to render.
 * @returns The string representation of the node.
 */
function renderAICINode(node: AICINode) {
    const { name } = node
    switch (name) {
        case "gen":
            // Extract options and build arguments for 'gen'
            const { regex, ...rest } = (node as AICIGenNode).options
            const args = Object.entries(rest).map(
                ([k, v]) => `${k}: ${JSON.stringify(v)}`
            )
            if (regex) args.push(`regex: ${regex.toString()}`)
            return `await gen({${args.join(`,\n`)}})`
        default:
            return "undefined" // Fallback for unknown node types
    }
}

/**
 * Escapes backticks in a JavaScript string for template literals.
 * Used to handle strings in template literals.
 * @param s - The string to escape.
 * @returns The escaped string.
 */
function escapeJavascriptString(s: string) {
    return s.replace(/`/g, "\\`")
}

/**
 * Renders the AICI code based on function name and root node.
 * Processes nodes and compiles the AICI script.
 * @param functionName - The name of the function to render.
 * @param root - The root node of the prompt structure.
 * @returns An object containing the AICI request and output processors.
 */
export async function renderAICI(functionName: string, root: PromptNode) {
    const notSupported = (reason: string) => () => {
        throw new NotSupportedError(reason)
    }

    let program: string[] = [] // Holds the generated program lines
    let indent: string = "" // Current indentation level
    const push = (text: string) => program.push(indent + text) // Add text with current indentation
    const pushString = (text: string) => {
        // Pushes a string to the program if it's not empty
        if (text !== undefined && text !== null && text !== "")
            push("await $`" + escapeJavascriptString(text) + "`")
    }

    const outputProcessors: PromptOutputProcessorHandler[] = [] // Handlers for output processing

    push(`async function ${functionName}() {`)
    indent = "  "
    // Visit the root node and process its children
    await visitNode(root, {
        text: async (n) => {
            const value = await n.value
            pushString(value)
        },
        stringTemplate: async (n) => {
            const { strings, args } = n
            for (let i = 0; i < strings.length; ++i) {
                pushString(strings[i])
                if (i < args.length) {
                    const arg = await args[i]
                    if (arg === undefined || arg === null) continue
                    if (typeof arg === "string") {
                        pushString(arg)
                    } else if (arg.type === "aici") {
                        const rarg = renderAICINode(arg)
                        push(rarg)
                    } else {
                        const rarg = JSON.stringify(arg)
                        pushString(rarg)
                    }
                }
            }
        },
        // Unsupported node types
        image: notSupported("image"),
        tool: notSupported("tool"),
        assistant: notSupported("assistant"),
        schema: notSupported("schema"),
        // Capture output processors
        outputProcessor: (n) => {
            outputProcessors.push(n.fn)
        },
    })

    indent = ""
    push("}")

    const content = program.join("\n")
    const aici: AICIRequest = { role: "aici", content, functionName }
    return { aici, outputProcessors }
}

/**
 * Interface for the initial run of a model.
 * Defines the structure of the initial run message.
 */
interface ModelInitialRun {
    id: string
    object: "initial-run"
    created: number
    model: string
}

/**
 * Command for interacting with storage.
 * Defines storage operations like setting or appending variables.
 */
type StorageCmd = {
    WriteVar: {
        name: string
        value: string // hex-encoded
        op: "Set" | "Append"
        when_version_is?: number // not relevant for us
    }
}

/**
 * Reasons for finishing a model run.
 * Enumerates possible reasons for completion or termination.
 */
type FinishReason =
    | "eos"
    | "length"
    | "abort"
    | "fail"
    | "aici-stop"
    | "deadlock"
    | "aici-out-of-fuel"

/**
 * Interface for a model run.
 * Defines the structure of the run message, including forks and usage.
 */
interface ModelRun {
    object: "run"
    forks: {
        index: number
        text: string
        error?: string
        logs?: string
        finish_reason?: FinishReason
        storage?: StorageCmd[]
    }[]
    usage: {
        sampled_tokens: number
        ff_tokens: number
        cost: number
    }
}

/**
 * Union type representing a message from the model.
 * Can be either an initial run or a regular run.
 */
type ModelMessage = ModelInitialRun | ModelRun

/**
 * Handles the completion of chat requests.
 * Processes incoming chat messages and constructs AICI script.
 * @param req - The chat request object.
 * @param connection - The connection details.
 * @param options - Options for processing the request.
 * @param trace - Tracing information for debugging.
 */
const AICIChatCompletion: ChatCompletionHandler = async (
    req,
    connection,
    options,
    trace
) => {
    const { messages, response_format, tools } = req
    const { requestOptions, partialCb, cancellationToken, inner } = options
    const { headers, ...rest } = requestOptions || {}

    // Check for unsupported features
    if (tools?.length) throw new NotSupportedError("AICI: tools not supported")
    if (response_format)
        throw new NotSupportedError("AICI: response_format not supported")

    let source: string[] = [] // Source code lines for the AICI script
    let main: string[] = ["async function main() {"] // Main function block
    const variables: Record<string, string> = {} // Variables used in the script

    // Process each message in the request
    messages.forEach((message, msgi) => {
        const { role, content } = message
        switch (role) {
            case "system":
            case "user": {
                // Process system or user message
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
                // Process aici message
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

    const fetchRetry = await createFetch({ trace })
    const postReq = {
        controller: AICI_CONTROLLER,
        controller_arg,
    }

    const { provider, model } = parseModelIdentifier(req.model)
    trace.itemValue(`provider`, provider)
    trace.itemValue(`model`, model)
    const url = `${connection.base}/${model}/${connection.version || "v1"}/run`
    trace.itemValue(`url`, url)
    trace.itemValue(`controller`, postReq.controller)
    trace.detailsFenced(`controller args`, postReq.controller_arg, "js")

    const body = JSON.stringify(postReq, null, 2)
    trace.detailsFenced(`body`, body, "json")

    // Send the request to the model server
    const r = await fetchRetry(url, {
        headers: {
            "api-key": connection.token,
            "User-Agent": TOOL_ID,
            "Content-Type": "application/json",
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
            normalizeInt(r.headers.get("retry-after"))
        )
    }

    let numTokens = 0 // Token counter for the response
    let finishReason: ChatCompletionResponse["finishReason"] = undefined
    let seenDone = false // Flag to track completion
    let chatResp = "" // Accumulated chat response

    let pref = "" // Prefix for data chunking

    const decoder = host.createUTF8Decoder() // UTF-8 decoder for processing data

    try {
        trace.startFence("txt")
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
    } finally {
        trace.endFence()
    }

    // Decode and log variables
    for (const k of Object.keys(variables)) {
        variables[k] = utf8Decode(fromHex(variables[k]))
        trace.itemValue(`var ${k}`, variables[k])
    }

    // If response has been completed successfully
    if (seenDone) {
        return { text: chatResp, finishReason, variables }
    } else {
        trace.error(`invalid response`)
        trace.fence(pref)
        throw new Error(`invalid response: ${pref}`)
    }

    /**
     * Processes a chunk of data from the response.
     * @param value - The chunk of data to process.
     */
    function doChunk(value: Uint8Array) {
        // Decode and process the chunk of data
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
                        const fork = obj.forks[0]
                        if (fork.logs) trace.log(fork.logs)
                        const content = fork.text
                        numTokens = obj.usage.ff_tokens
                        chatResp += content
                        for (const op of fork.storage || []) {
                            if (op.WriteVar.op === "Set") {
                                variables[op.WriteVar.name] = op.WriteVar.value
                            } else if (op.WriteVar.op === "Append") {
                                variables[op.WriteVar.name] += op.WriteVar.value
                            }
                        }
                        // Handle finish reasons
                        if (fork.finish_reason === "aici-stop") {
                            finishReason = "stop"
                            seenDone = true
                        } else if (fork.finish_reason === "fail") {
                            finishReason = "fail"
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
            partialCb?.({
                responseSoFar: chatResp,
                tokensSoFar: numTokens,
                responseChunk: progress,
                inner,
            })
        }
        pref = chunk
    }
}

/**
 * Lists available models based on configuration.
 * Fetches model information from the server.
 * @param cfg - The configuration for the language model.
 * @returns A list of language model information.
 */
async function listModels(cfg: LanguageModelConfiguration) {
    const { token, base, version } = cfg
    const url = `${base}/proxy/info`
    const fetch = await createFetch()
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "api-key": token,
            "User-Agent": TOOL_ID,
            Accept: "application/json",
        },
    })
    if (res.status !== 200) return []
    const body = (await res.json()) as {
        prefixes: string[]
    }
    return body.prefixes.map(
        (tag) =>
            <LanguageModelInfo>{
                id: tag.replace(/^\//, ""),
            }
    )
}

/**
 * Represents the AICI language model.
 * Provides model information and completion functionality.
 */
export const AICIModel = Object.freeze<LanguageModel>({
    completer: AICIChatCompletion,
    id: "aici",
    listModels,
})
