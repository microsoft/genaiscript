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

function renderAICINode(node: AICINode) {
    const { name } = node
    switch (name) {
        case "gen":
            const { regex, ...rest } = (node as AICIGenNode).options
            const args = Object.entries(rest).map(
                ([k, v]) => `${k}: ${JSON.stringify(v)}`
            )
            if (regex) args.push(`regex: ${regex.toString()}`)
            return `await gen({${args.join(`,\n`)}})`
        default:
            return "undefined"
    }
}

function escapeJavascriptString(s: string) {
    return s.replace(/`/g, "\\`")
}

export async function renderAICI(functionName: string, root: PromptNode) {
    const notSupported = (reason: string) => () => {
        throw new NotSupportedError(reason)
    }

    let program: string[] = []
    let indent: string = ""
    const push = (text: string) => program.push(indent + text)
    const pushString = (text: string) => {
        if (text !== undefined && text !== null && text !== "")
            push("await $`" + escapeJavascriptString(text) + "`")
    }

    const outputProcessors: PromptOutputProcessorHandler[] = []

    push(`async function ${functionName}() {`)
    indent = "  "
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
        image: notSupported("image"),
        function: notSupported("function"),
        // TODO?
        assistant: notSupported("assistant"),
        schema: notSupported("schema"),
        outputProcessor: (n) => {
            outputProcessors.push(n.fn)
        },
        // ignore
        // fileMerge,
    })

    indent = ""
    push("}")

    const content = program.join("\n")
    const aici: AICIRequest = { role: "aici", content, functionName }
    return { aici, outputProcessors }
}

interface ModelInitialRun {
    id: string
    object: "initial-run"
    created: number
    model: string
}

type StorageCmd = {
    WriteVar: {
        name: string
        value: string // hex-encoded
        op: "Set" | "Append"
        when_version_is?: number // not relevant for us
    }
}

type FinishReason =
    | "eos"
    | "length"
    | "abort"
    | "fail"
    | "aici-stop"
    | "deadlock"
    | "aici-out-of-fuel"

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

type ModelMessage = ModelInitialRun | ModelRun

const AICIChatCompletion: ChatCompletionHandler = async (
    req,
    connection,
    options,
    trace
) => {
    const { messages, response_format, tools } = req
    const { requestOptions, partialCb, cancellationToken } = options
    const { headers, ...rest } = requestOptions || {}

    if (tools?.length) throw new NotSupportedError("AICI: tools not supported")
    if (response_format)
        throw new NotSupportedError("AICI: response_format not supported")

    let source: string[] = []
    let main: string[] = ["async function main() {"]
    const variables: Record<string, string> = {}

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

    const r = await fetchRetry(url, {
        headers: {
            "api-key": connection.token,
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
            normalizeInt(r.headers.get("retry-after"))
        )
    }

    let numTokens = 0
    let finishReason: ChatCompletionResponse["finishReason"] = undefined
    let seenDone = false
    let chatResp = ""

    let pref = ""

    const decoder = host.createUTF8Decoder()

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

    for (const k of Object.keys(variables)) {
        variables[k] = utf8Decode(fromHex(variables[k]))
        trace.itemValue(`var ${k}`, variables[k])
    }

    if (seenDone) {
        return { text: chatResp, finishReason, variables }
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
                        // TODO handle other finish reasons
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

async function listModels(cfg: LanguageModelConfiguration) {
    const { token, base, version } = cfg
    const url = `${base}/proxy/info`
    const fetch = await createFetch()
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "api-key": token,
            "user-agent": TOOL_ID,
            accept: "application/json",
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

export const AICIModel = Object.freeze<LanguageModel>({
    completer: AICIChatCompletion,
    id: "aici",
    listModels,
})
