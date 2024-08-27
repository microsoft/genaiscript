import { MarkdownTrace } from "./trace"
import { PromptImage, renderPromptNode } from "./promptdom"
import { LanguageModelConfiguration, host } from "./host"
import { GenerationOptions } from "./generation"
import { JSON5parse, JSONLLMTryParse, isJSONObjectOrArray } from "./json5"
import {
    CancellationOptions,
    CancellationToken,
    checkCancelled,
} from "./cancellation"
import { assert, logError, logVerbose } from "./util"
import { extractFenced, findFirstDataFence, unfence } from "./fence"
import {
    toStrictJSONSchema,
    validateFencesWithSchema,
    validateJSONWithSchema,
} from "./schema"
import { MAX_DATA_REPAIRS, MAX_TOOL_CALLS } from "./constants"
import { parseAnnotations } from "./annotations"
import { errorMessage, isCancelError, serializeError } from "./error"
import { estimateChatTokens } from "./chatencoder"
import { createChatTurnGenerationContext } from "./runpromptcontext"
import { dedent } from "./indent"
import { traceLanguageModelConnection } from "./models"
import {
    ChatCompletionContentPartImage,
    ChatCompletionMessageParam,
    ChatCompletionResponse,
    ChatCompletionsOptions,
    ChatCompletionTool,
    ChatCompletionUserMessageParam,
    CreateChatCompletionRequest,
} from "./chattypes"
import { renderMessageContent, renderMessagesToMarkdown } from "./chatrender"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { fenceMD } from "./markdown"
import { YAMLStringify } from "./yaml"

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
    options: ChatCompletionsOptions & CancellationOptions,
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
    tools: ToolCallback[],
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
            const callArgs: any = call.arguments // sometimes wrapped in \`\`\`json ...
                ? JSONLLMTryParse(call.arguments)
                : undefined
            trace.fence(call.arguments, "json")
            if (callArgs === undefined) trace.error("arguments failed to parse")

            let todos: { tool: ToolCallback; args: any }[]
            if (call.name === "multi_tool_use.parallel") {
                // special undocumented openai hallucination, argument contains multiple tool calls
                // {
                //  "id": "call_D48fudXi4oBxQ2rNeHhpwIKh",
                //  "name": "multi_tool_use.parallel",
                //  "arguments": "{\"tool_uses\":[{\"recipient_name\":\"functions.fs_find_files\",\"parameters\":{\"glob\":\"src/content/docs/**/*.md\"}},{\"recipient_name\":\"functions.fs_find_files\",\"parameters\":{\"glob\":\"src/content/docs/**/*.mdx\"}},{\"recipient_name\":\"functions.fs_find_files\",\"parameters\":{\"glob\":\"../packages/sample/src/*.genai.{js,mjs}\"}},{\"recipient_name\":\"functions.fs_find_files\",\"parameters\":{\"glob\":\"src/assets/*.txt\"}}]}"
                // }
                const toolUses = callArgs.tool_uses as {
                    recipient_name: string
                    parameters: any
                }[]
                todos = toolUses.map((tu) => {
                    const toolName = tu.recipient_name.replace(
                        /^functions\./,
                        ""
                    )
                    const tool = tools.find((f) => f.spec.name === toolName)
                    if (!tool) {
                        logVerbose(JSON.stringify(tu, null, 2))
                        throw new Error(`tool ${toolName} not found`)
                    }
                    return { tool, args: tu.parameters }
                })
            } else {
                const tool = tools.find((f) => f.spec.name === call.name)
                if (!tool) {
                    logVerbose(JSON.stringify(call, null, 2))
                    throw new Error(`tool ${call.name} not found`)
                }
                todos = [{ tool, args: callArgs }]
            }

            const toolResult: string[] = []
            for (const todo of todos) {
                const { tool, args } = todo
                const context: ToolCallContext = {
                    trace,
                }
                const output = await tool.impl({ context, ...args })
                if (output === undefined || output === null)
                    throw new Error(
                        `tool ${tool.spec.name} output is undefined`
                    )
                let toolContent: string = undefined
                let toolEdits: Edits[] = undefined
                if (typeof output === "string") toolContent = output
                else if (
                    typeof output === "number" ||
                    typeof output === "boolean"
                )
                    toolContent = String(output)
                else if (
                    typeof output === "object" &&
                    (output as ShellOutput).exitCode !== undefined
                ) {
                    const { stdout, stderr, exitCode } = output as ShellOutput
                    toolContent = `EXIT_CODE: ${exitCode}

STDOUT:
${stdout || ""}

STDERR:
${stderr || ""}`
                } else if (
                    typeof output === "object" &&
                    (output as WorkspaceFile).filename &&
                    (output as WorkspaceFile).content
                ) {
                    const { filename, content } = output as WorkspaceFile
                    toolContent = `FILENAME: ${filename}
${fenceMD(content, " ")}
`
                } else {
                    toolContent = YAMLStringify(output)
                }

                if (typeof output === "object")
                    toolEdits = (output as ToolCallContent)?.edits

                if (toolContent) trace.fence(toolContent, "markdown")
                if (toolEdits?.length) {
                    trace.fence(toolEdits)
                    edits.push(
                        ...toolEdits.map((e) => {
                            const { filename, ...rest } = e
                            const n = e.filename
                            const fn = /^[^\/]/.test(n)
                                ? host.resolvePath(projFolder, n)
                                : n
                            return { filename: fn, ...rest }
                        })
                    )
                }

                toolResult.push(toolContent)
            }
            messages.push({
                role: "tool",
                content: toolResult.join("\n\n"),
                tool_call_id: call.id,
            })
        } catch (e) {
            logError(e)
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
    const {
        stats,
        trace,
        responseSchema,
        maxDataRepairs = MAX_DATA_REPAIRS,
        infoCb,
    } = options
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant" || lastMessage.refusal) return false

    const content = renderMessageContent(lastMessage)
    const fences = extractFenced(content)
    validateFencesWithSchema(fences, schemas, { trace })
    const invalids = fences.filter((f) => f?.validation?.valid === false)

    if (responseSchema) {
        const value = JSONLLMTryParse(content)
        const schema = promptParametersSchemaToJSONSchema(responseSchema)
        const res = validateJSONWithSchema(value, schema, { trace })
        if (!res.valid)
            invalids.push({
                label: "",
                content,
                validation: res,
            })
    }

    // nothing to repair
    if (!invalids.length) return false
    // too many attempts
    if (stats.repairs >= maxDataRepairs) {
        trace.error(`maximum number of repairs (${maxDataRepairs}) reached`)
        return false
    }

    infoCb?.({ text: "appending data repair instructions" })
    // let's get to work
    trace.startDetails("🔧 data repairs")
    const repair = invalids
        .map(
            (f) =>
                `data: ${f.label || ""}
schema: ${f.args?.schema || ""},
error: ${f.validation.error}`
        )
        .join("\n\n")
    const repairMsg = dedent`DATA_FORMAT_ISSUES:
\`\`\`
${repair}
\`\`\`
                            
Repair the DATA_FORMAT_ISSUES. THIS IS IMPORTANT.`
    trace.fence(repairMsg, "markdown")
    messages.push({
        role: "user",
        content: [
            {
                type: "text",
                text: repairMsg,
            },
        ],
    })
    trace.endDetails()
    stats.repairs++
    return true
}

function assistantText(
    messages: ChatCompletionMessageParam[],
    responseType?: PromptTemplateResponseType
) {
    let text = ""
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        if (msg.role !== "assistant") break
        text = msg.content + text
    }

    if (responseType === undefined) {
        text = unfence(text, "(markdown|md)")
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
    const text = assistantText(messages, responseType)
    const annotations = parseAnnotations(text)
    const finishReason = isCancelError(err)
        ? "cancel"
        : (resp?.finishReason ?? "fail")
    const error = serializeError(err)

    const fences = extractFenced(text)
    let json: any
    if (responseType === "json_schema") {
        try {
            json = JSON.parse(text)
        } catch (e) {
            trace.error("response json_schema parsing failed", e)
        }
    } else if (responseType === "json_object") {
        try {
            json = JSON5parse(text, { repair: true })
            if (responseSchema) {
                const schema =
                    promptParametersSchemaToJSONSchema(responseSchema)
                const res = validateJSONWithSchema(json, schema, {
                    trace,
                })
                if (!res.valid) {
                    trace.fence(schema, "json")
                    trace?.warn(
                        `response schema validation failed, ${errorMessage(res.error)}`
                    )
                }
            }
        } catch (e) {
            trace.error("response json_object parsing failed", e)
        }
    } else {
        json = isJSONObjectOrArray(text)
            ? JSONLLMTryParse(text)
            : (undefined ?? findFirstDataFence(fences))
    }
    const frames: DataFrame[] = []

    // validate schemas in fences
    if (fences?.length)
        frames.push(...validateFencesWithSchema(fences, schemas, { trace }))

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
    tools: ToolCallback[],
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

    if (resp.text)
        messages.push({
            role: "assistant",
            content: resp.text,
        })

    // execute tools as needed
    if (resp.toolCalls?.length) {
        await runToolCalls(resp, messages, tools, options)
        stats.toolCalls += resp.toolCalls.length
        if (stats.toolCalls > maxToolCalls)
            throw new Error(
                `maximum number of tool calls ${maxToolCalls} reached`
            )
        return undefined // keep working
    }
    // apply repairs if necessary
    if (await applyRepairs(messages, schemas, options)) {
        return undefined // keep working
    }

    if (chatParticipants?.length) {
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
    runOptions: ModelOptions & EmbeddingsModelOptions
): GenerationOptions {
    return {
        ...options,
        ...(runOptions || {}),
        model:
            runOptions?.model ??
            options?.model ??
            host.defaultModelOptions.model,
        temperature:
            runOptions?.temperature ?? host.defaultModelOptions.temperature,
        embeddingsModel:
            runOptions?.embeddingsModel ??
            options?.embeddingsModel ??
            host.defaultEmbeddingsModelOptions.embeddingsModel,
    }
}

export async function executeChatSession(
    connectionToken: LanguageModelConfiguration,
    cancellationToken: CancellationToken,
    messages: ChatCompletionMessageParam[],
    vars: Partial<ExpansionVariables>,
    toolDefinitions: ToolCallback[],
    schemas: Record<string, JSONSchema>,
    completer: ChatCompletionHandler,
    chatParticipants: ChatParticipant[],
    genOptions: GenerationOptions
): Promise<RunPromptResult> {
    const {
        trace,
        model = host.defaultModelOptions.model,
        temperature = host.defaultModelOptions.temperature,
        topP,
        maxTokens,
        seed,
        responseType,
        responseSchema,
        stats,
        infoCb,
    } = genOptions

    traceLanguageModelConnection(trace, genOptions, connectionToken)
    const tools: ChatCompletionTool[] = toolDefinitions?.length
        ? toolDefinitions.map((f) => ({
              type: "function",
              function: f.spec as any,
          }))
        : undefined
    trace.startDetails(`🧠 llm chat`)
    if (tools?.length) trace.detailsFenced(`🛠️ tools`, tools, "yaml")
    try {
        let genVars: Record<string, string>
        while (true) {
            stats.turns++
            infoCb?.({
                text: `prompting ${model} (~${estimateChatTokens(model, messages)} tokens)`,
            })
            if (messages)
                trace.details(
                    `💬 messages (${messages.length})`,
                    renderMessagesToMarkdown(messages)
                )

            // make request
            let resp: ChatCompletionResponse
            try {
                checkCancelled(cancellationToken)
                try {
                    trace.startDetails(`📤 llm request`)
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
                            response_format:
                                responseType === "json_object"
                                    ? { type: responseType }
                                    : responseType === "json_schema"
                                      ? {
                                            type: "json_schema",
                                            json_schema: {
                                                name: "result",
                                                schema: toStrictJSONSchema(
                                                    responseSchema
                                                ),
                                                strict: true,
                                            },
                                        }
                                      : undefined,
                        },
                        connectionToken,
                        genOptions,
                        trace
                    )
                    if (resp.variables)
                        genVars = { ...(genVars || {}), ...resp.variables }
                } finally {
                    logVerbose("")
                    trace.endDetails()
                }

                const output = await processChatMessage(
                    resp,
                    messages,
                    toolDefinitions,
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
            }
        }
    } finally {
        trace.endDetails()
    }
}

export function tracePromptResult(trace: MarkdownTrace, resp: RunPromptResult) {
    const { json, text } = resp
    trace.detailsFenced(`🔠 output`, text, `markdown`)
    if (resp.json) trace.detailsFenced("📩 JSON (parsed)", json, "json")
}
