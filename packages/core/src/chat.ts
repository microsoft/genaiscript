import OpenAI from "openai"
import { JSONLineCache } from "./cache"
import { MarkdownTrace } from "./trace"
import { PromptImage, renderPromptNode } from "./promptdom"
import { AICIRequest } from "./aici"
import { LanguageModelConfiguration, host } from "./host"
import { GenerationOptions } from "./promptcontext"
import { JSON5TryParse, JSON5parse, isJSONObjectOrArray } from "./json5"
import { CancellationToken, checkCancelled } from "./cancellation"
import { assert } from "./util"
import {
    extractFenced,
    findFirstDataFence,
    renderFencedVariables,
} from "./fence"
import { validateFencesWithSchema, validateJSONWithSchema } from "./schema"
import dedent from "ts-dedent"
import {
    CHAT_CACHE,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    MAX_DATA_REPAIRS,
    MAX_TOOL_CALLS,
} from "./constants"
import { parseAnnotations } from "./annotations"
import { isCancelError, serializeError } from "./error"
import { fenceMD } from "./markdown"
import { YAMLStringify } from "./yaml"
import { estimateChatTokens } from "./tokens"
import { createChatTurnGenerationContext } from "./runpromptcontext"

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
    ModelOptions &
    Omit<LanguageModelConfiguration, "token" | "source">

export type ChatCompletationRequestCacheValue = {
    text: string
    finishReason: ChatCompletionResponse["finishReason"]
}

export type ChatCompletationRequestCache = JSONLineCache<
    ChatCompletionRequestCacheKey,
    ChatCompletationRequestCacheValue
>

export function getChatCompletionCache(
    name?: string
): ChatCompletationRequestCache {
    return JSONLineCache.byName<
        ChatCompletionRequestCacheKey,
        ChatCompletationRequestCacheValue
    >(name || CHAT_CACHE)
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
    connection: LanguageModelConfiguration,
    options: ChatCompletionsOptions,
    trace: MarkdownTrace
) => Promise<ChatCompletionResponse>

export interface LanguageModelInfo {
    id: string
    details?: string
    url?: string
}

export type ListModelsFunction = (
    cfg: LanguageModelConfiguration
) => Promise<LanguageModelInfo[]>

export interface LanguageModel {
    id: string
    completer: ChatCompletionHandler
    listModels?: ListModelsFunction
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

    messages.push({
        role: "assistant",
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
        trace.startDetails(`📠 tool call ${call.name}`)
        try {
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
            if (output === undefined || output === null)
                throw new Error(`output is undefined`)
            if (typeof output === "string") output = { content: output }

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
    const { trace, responseSchema } = options
    // perform repair
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant") return false

    const fences = extractFenced(lastMessage.content)
    validateFencesWithSchema(fences, schemas, { trace })
    const invalids = fences
        .map((f) => f.validation)
        .filter((f) => f?.valid === false)

    if (responseSchema) {
        const value = JSON5TryParse(lastMessage.content)
        const res = validateJSONWithSchema(value, responseSchema, { trace })
        if (!res.valid) invalids.push(res)
    }

    if (invalids.length) {
        trace.startDetails("🔧 repair")
        const repair = invalids.map((f) => f.error).join("\n\n")
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

function assistantText(messages: ChatCompletionMessageParam[]) {
    let text = ""
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        if (msg.role !== "assistant") break
        text = msg.content + text
    }
    return text
}

function structurifyChatSession(
    messages: ChatCompletionMessageParam[],
    schemas: Record<string, JSONSchema>,
    genVars: Record<string, string>,
    options: GenerationOptions,
    others?: {
        resp?: ChatCompletionResponse
        err?: any
    }
): RunPromptResult {
    const { trace, responseType, responseSchema } = options
    const { resp, err } = others || {}
    const text = assistantText(messages)
    const annotations = parseAnnotations(text)
    const finishReason = isCancelError(err)
        ? "cancel"
        : resp?.finishReason ?? "fail"
    const error = serializeError(err)

    const fences = extractFenced(text)
    let json: any
    if (responseType === "json_object") {
        try {
            json = JSON5parse(text, { repair: true })
            if (responseSchema) {
                const res = validateJSONWithSchema(json, responseSchema, {
                    trace,
                })
                if (!res.valid) {
                    trace.error("response schema validation failed", res.error)
                }
            }
        } catch (e) {
            trace.error("response json_object parsing failed", e)
        }
    } else {
        json = isJSONObjectOrArray(text)
            ? JSON5TryParse(text, undefined)
            : undefined ?? findFirstDataFence(fences)
    }
    const frames: DataFrame[] = []

    // validate schemas in fences
    if (fences?.length) {
        frames.push(...validateFencesWithSchema(fences, schemas, { trace }))
        trace.details("📩 code regions", renderFencedVariables(fences))
    }

    return {
        text,
        annotations,
        finishReason,
        fences,
        frames,
        json,
        error,
        genVars,
        schemas,
    }
}

async function processChatMessage(
    resp: ChatCompletionResponse,
    messages: ChatCompletionMessageParam[],
    functions: ChatFunctionCallback[],
    chatParticipants: ChatParticipant[],
    schemas: Record<string, JSONSchema>,
    genVars: Record<string, string>,
    options: GenerationOptions
): Promise<RunPromptResult> {
    const {
        stats,
        maxToolCalls = MAX_TOOL_CALLS,
        trace,
        cancellationToken,
    } = options
    const maxRepairs = MAX_DATA_REPAIRS

    if (resp.text)
        messages.push({
            role: "assistant",
            content: resp.text,
        })

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
    else if (await applyRepairs(messages, schemas, options)) {
        stats.repairs++
        if (stats.repairs > maxRepairs)
            throw new Error(`maximum number of repairs (${maxRepairs}) reached`)
        return undefined // keep working
    } else if (chatParticipants?.length) {
        let needsNewTurn = false
        for (const participant of chatParticipants) {
            try {
                const { generator, options: participantOptions } =
                    participant || {}
                const { label } = participantOptions || {}
                trace.startDetails(`🙋 participant ${label || ""}`)

                const ctx = createChatTurnGenerationContext(options, trace)
                await generator(ctx, structuredClone(messages))
                const node = ctx.node
                checkCancelled(cancellationToken)
                // expand template
                const { errors, prompt } = await renderPromptNode(
                    options.model,
                    node,
                    {
                        trace,
                    }
                )
                if (prompt?.trim().length) {
                    trace.detailsFenced(`💬 message`, prompt, "markdown")
                    messages.push({ role: "user", content: prompt })
                    needsNewTurn = true
                } else trace.item("no message")
                if (errors?.length) {
                    for (const error of errors) trace.error(undefined, error)
                    needsNewTurn = false
                    break
                }
            } catch (e) {
                trace.error(`participant error`, e)
                needsNewTurn = false
                break
            } finally {
                trace?.endDetails()
            }
        }
        if (needsNewTurn) return undefined
    }

    return structurifyChatSession(messages, schemas, genVars, options, {
        resp,
    })
}

export function mergeGenerationOptions(
    options: GenerationOptions,
    runOptions: ModelOptions
): GenerationOptions {
    return {
        ...options,
        ...(runOptions || {}),
        model: runOptions?.model ?? options?.model ?? DEFAULT_MODEL,
        temperature: runOptions?.temperature ?? DEFAULT_TEMPERATURE,
    }
}

export async function executeChatSession(
    connectionToken: LanguageModelConfiguration,
    cancellationToken: CancellationToken,
    messages: ChatCompletionMessageParam[],
    vars: Partial<ExpansionVariables>,
    functions: ChatFunctionCallback[],
    schemas: Record<string, JSONSchema>,
    completer: ChatCompletionHandler,
    chatParticipants: ChatParticipant[],
    genOptions: GenerationOptions
) {
    const {
        trace,
        model = DEFAULT_MODEL,
        temperature = DEFAULT_TEMPERATURE,
        topP,
        maxTokens,
        seed,
        cacheName,
        responseType,
        responseSchema,
        stats,
        infoCb,
    } = genOptions

    const tools: ChatCompletionTool[] = functions?.length
        ? functions.map((f) => ({
              type: "function",
              function: f.definition as any,
          }))
        : undefined
    trace.startDetails(`🧠 llm chat`)
    try {
        trace.itemValue(`model`, model)
        trace.itemValue(`temperature`, temperature)
        trace.itemValue(`top_p`, topP)
        trace.itemValue(`seed`, seed)
        trace.itemValue(`cache name`, cacheName)
        trace.itemValue(`response type`, responseType)
        if (responseSchema)
            trace.detailsFenced(`📦 response schema`, responseSchema, "json")

        let genVars: Record<string, string>
        while (true) {
            stats.turns++
            infoCb?.({
                text: `prompting ${model} (~${estimateChatTokens(model, messages)} tokens)`,
            })
            trace.details(`💬 messages`, renderMessagesToMarkdown(messages))
            trace.startDetails(`📤 llm request (${messages.length} messages)`)
            let resp: ChatCompletionResponse
            try {
                checkCancelled(cancellationToken)
                resp = await completer(
                    {
                        model,
                        temperature: temperature,
                        top_p: topP,
                        max_tokens: maxTokens,
                        seed,
                        stream: true,
                        messages,
                        tools,
                        response_format: responseType
                            ? { type: responseType }
                            : undefined,
                    },
                    connectionToken,
                    genOptions,
                    trace
                )
                if (resp.variables)
                    genVars = { ...(genVars || {}), ...resp.variables }
                const output = await processChatMessage(
                    resp,
                    messages,
                    functions,
                    chatParticipants,
                    schemas,
                    genVars,
                    genOptions
                )
                if (output) return output
            } catch (err) {
                return structurifyChatSession(
                    messages,
                    schemas,
                    genVars,
                    genOptions,
                    { resp, err }
                )
            } finally {
                trace.endDetails()
            }
        }
    } finally {
        trace.endDetails()
    }
}

function renderMessagesToMarkdown(messages: ChatCompletionMessageParam[]) {
    const res: string[] = []
    messages.forEach((msg) => {
        const { role } = msg
        const roleMsg = `> ${role}`
        switch (role) {
            case "system":
                res.push(roleMsg)
                res.push(fenceMD(msg.content, "markdown"))
                break
            case "user":
                res.push(roleMsg)
                if (typeof msg.content === "string")
                    res.push(fenceMD(msg.content, "markdown"))
                else if (Array.isArray(msg.content))
                    for (const part of msg.content) {
                        if (part.type === "text")
                            res.push(fenceMD(part.text, "markdown"))
                        else if (part.type === "image_url")
                            res.push(`![image](${part.image_url.url})`)
                        else res.push(fenceMD(YAMLStringify(part), "yaml"))
                    }
                else res.push(fenceMD(YAMLStringify(msg), "yaml"))
                break
            case "assistant":
                res.push(roleMsg)
                res.push(fenceMD(msg.content, "markdown"))
                break
            case "aici":
                res.push(`> ${role} ${msg.functionName}`)
                res.push(fenceMD(msg.content, "markdown"))
                break
            case "tool":
                res.push(`> ${role} ${msg.tool_call_id}`)
                res.push(fenceMD(msg.content, "json"))
                break
            default:
                res.push(roleMsg)
                res.push(fenceMD(YAMLStringify(msg), "yaml"))
                break
        }
    })
    return res.filter((s) => s !== undefined).join("\n")
}
