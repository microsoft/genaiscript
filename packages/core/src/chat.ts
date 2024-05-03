import OpenAI from "openai"
import { Cache } from "./cache"
import { MarkdownTrace } from "./trace"
import { PromptImage } from "./promptdom"
import { AICIRequest } from "./aici"
import { OAIToken, host } from "./host"
import { GenerationOptions } from "./promptcontext"
import { JSON5TryParse } from "./json5"
import { exec } from "./exec"
import { checkCancelled } from "./cancellation"
import { assert } from "./util"
import { extractFenced } from "./template"
import { validateFencesWithSchema } from "./schema"
import dedent from "ts-dedent"
import { MAX_DATA_REPAIRS, MAX_TOOL_CALLS } from "./constants"

export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool

export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk

export type ChatCompletionSystemMessageParam =
    OpenAI.Chat.Completions.ChatCompletionSystemMessageParam

export type ChatCompletionMessageParam =
    | OpenAI.Chat.Completions.ChatCompletionMessageParam
    | AICIRequest

export type CreateChatCompletionRequest = Omit<
    OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
    "messages"
> & {
    /**
     * A list of messages comprising the conversation so far.
     * [Example Python code](https://cookbook.openai.com/examples/how_to_format_inputs_to_chatgpt_models).
     */
    //  messages: Array<ChatCompletionMessageParam>;
    messages: ChatCompletionMessageParam[]
}

export type ChatCompletionAssistantMessageParam =
    OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam

export type ChatCompletionUserMessageParam =
    OpenAI.Chat.Completions.ChatCompletionUserMessageParam

export type ChatCompletionContentPartImage =
    OpenAI.Chat.Completions.ChatCompletionContentPartImage

export interface ChatCompletionToolCall {
    id: string
    name: string
    arguments?: string
}

export interface ChatCompletionResponse {
    text?: string
    cached?: boolean
    variables?: Record<string, string>
    toolCalls?: ChatCompletionToolCall[]
    finishReason?:
        | "stop"
        | "length"
        | "tool_calls"
        | "content_filter"
        | "cancel"
        | "fail"
}

export const ModelError = OpenAI.APIError

export type ChatCompletionRequestCacheKey = CreateChatCompletionRequest &
    Omit<OAIToken, "token" | "source">

export function getChatCompletionCache(name?: string) {
    return Cache.byName<ChatCompletionRequestCacheKey, string>(name || "chat")
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
    cacheName?: string
    retry?: number
    retryDelay?: number
    maxDelay?: number
}

export function toChatCompletionUserMessage(
    expanded: string,
    images?: PromptImage[]
): ChatCompletionUserMessageParam {
    const imgs = images?.filter(({ url }) => url) || []
    if (imgs.length)
        return <ChatCompletionUserMessageParam>{
            role: "user",
            content: [
                {
                    type: "text",
                    text: expanded,
                },
                ...imgs.map(
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
    else
        return <ChatCompletionUserMessageParam>{
            role: "user",
            content: expanded,
        }
}
/*
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
*/
export type ChatCompletionHandler = (
    req: CreateChatCompletionRequest,
    connection: OAIToken,
    options: ChatCompletionsOptions,
    trace: MarkdownTrace
) => Promise<ChatCompletionResponse>

export interface LanguageModel {
    id: string
    completer: ChatCompletionHandler
}

function traceCompletionResonse(
    trace: MarkdownTrace,
    resp: ChatCompletionResponse
) {
    if (resp.text) {
        trace.startDetails("📩 llm response")
        if (resp.finishReason && resp.finishReason !== "stop")
            trace.itemValue(`finish reason`, resp.finishReason)
        trace.itemValue(`cached`, resp.cached)
        trace.detailsFenced(`output`, resp.text, "markdown")
        trace.endDetails()
    }
}

async function runToolCalls(
    resp: ChatCompletionResponse,
    messages: ChatCompletionMessageParam[],
    functions: ChatFunctionCallback[],
    options: GenerationOptions
) {
    const projFolder = host.projectFolder()
    const { cancellationToken, trace } = options || {}
    assert(!!trace)
    let edits: Edits[] = []

    if (resp.text)
        messages.push({
            role: "assistant",
            content: resp.text,
        })
    messages.push({
        role: "assistant",
        content: null,
        tool_calls: resp.toolCalls.map((c) => ({
            id: c.id,
            function: {
                name: c.name,
                arguments: c.arguments,
            },
            type: "function",
        })),
    })

    // call tool and run again
    for (const call of resp.toolCalls) {
        checkCancelled(cancellationToken)
        try {
            trace.startDetails(`📠 tool call ${call.name}`)
            trace.itemValue(`id`, call.id)

            const callArgs: any = call.arguments
                ? JSON5TryParse(call.arguments)
                : undefined
            trace.itemValue(`args`, callArgs ?? call.arguments)
            const fd = functions.find((f) => f.definition.name === call.name)
            if (!fd) throw new Error(`tool ${call.name} not found`)

            const context: ChatFunctionCallContext = {
                trace,
            }

            let output = await fd.fn({ context, ...callArgs })
            if (typeof output === "string") output = { content: output }
            if (output?.type === "shell") {
                let {
                    command,
                    args = [],
                    stdin,
                    cwd,
                    timeout,
                    ignoreExitCode,
                    files,
                    outputFile,
                } = output
                trace.item(`shell command: \`${command}\` ${args.join(" ")}`)
                const { stdout, stderr, exitCode } = await exec(host, {
                    trace,
                    label: call.name,
                    call: {
                        type: "shell",
                        command,
                        args,
                        stdin,
                        files,
                        outputFile,
                        cwd: cwd ?? projFolder,
                        timeout: timeout ?? 60000,
                    },
                })
                output = { content: stdout }
                trace.itemValue(`exit code`, exitCode)
                if (stdout) trace.details("📩 shell output", stdout)
                if (stderr) trace.details("📩 shell error", stderr)
                if (exitCode !== 0 && !ignoreExitCode)
                    throw new Error(
                        `tool ${call.name} failed with exit code ${exitCode}}`
                    )
            }

            const { content, edits: functionEdits } = output

            if (content) trace.fence(content, "markdown")
            if (functionEdits?.length) {
                trace.fence(functionEdits)
                edits.push(
                    ...functionEdits.map((e) => {
                        const { filename, ...rest } = e
                        const n = e.filename
                        const fn = /^[^\/]/.test(n)
                            ? host.resolvePath(projFolder, n)
                            : n
                        return { filename: fn, ...rest }
                    })
                )
            }

            messages.push({
                role: "tool",
                content,
                tool_call_id: call.id,
            })
        } catch (e) {
            trace.error(`tool call ${call.id} error`, e)
            throw e
        } finally {
            trace.endDetails()
        }
    }

    return { edits }
}

async function applyRepairs(
    messages: ChatCompletionMessageParam[],
    schemas: Record<string, JSONSchema>,
    options: GenerationOptions
) {
    const { trace } = options
    // perform repair
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant") return false

    const fences = extractFenced(lastMessage.content)
    validateFencesWithSchema(fences, schemas, { trace })
    const invalids = fences.filter((f) => f.validation?.valid === false)
    if (invalids.length) {
        trace.startDetails("🔧 repair")
        const repair = invalids
            .map((f) => `${f.label}: ${f.validation.error}`)
            .join("\n")
        trace.fence(repair, "txt")
        messages.push({
            role: "user",
            content: [
                {
                    type: "text",
                    text: dedent`FORMATING_ISSUES:
                        \`\`\`
                        ${repair}
                        \`\`\`
                                            
                        Repair the FORMATING_ISSUES. THIS IS IMPORTANT.`,
                },
            ],
        })
        trace.endDetails()
        return true
    }

    return false
}

export function renderText(
    resp: ChatCompletionResponse,
    messages: ChatCompletionMessageParam[]
) {
    return (
        messages
            .filter((msg) => msg.role === "assistant" && msg.content)
            .map((m) => m.content)
            .join("\n") + resp.text
    )
}

export async function processChatMessage(
    resp: ChatCompletionResponse,
    messages: ChatCompletionMessageParam[],
    functions: ChatFunctionCallback[],
    schemas: Record<string, JSONSchema>,
    options: GenerationOptions
): Promise<string> {
    const { stats, maxToolCalls = MAX_TOOL_CALLS, trace } = options
    const maxRepairs = MAX_DATA_REPAIRS

    traceCompletionResonse(trace, resp)

    // execute tools as needed
    if (resp.toolCalls?.length) {
        await runToolCalls(resp, messages, functions, options)
        stats.toolCalls += resp.toolCalls.length
        if (stats.toolCalls > maxToolCalls)
            throw new Error(
                `maximum number of tool calls ${maxToolCalls} reached`
            )
        return undefined // keep working
    }
    // apply repairs if necessary
    else if (applyRepairs(messages, schemas, options)) {
        stats.repairs++
        if (stats.repairs >= maxRepairs)
            throw new Error(`maximum number of repairs (${maxRepairs}) reached`)
        return undefined // keep working
    }

    const text = renderText(resp, messages)
    return text
}
