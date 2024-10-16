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
import { assert, logError, logVerbose, logWarn } from "./util"
import { extractFenced, findFirstDataFence, unfence } from "./fence"
import {
    JSONSchemaToFunctionParameters,
    toStrictJSONSchema,
    validateFencesWithSchema,
    validateJSONWithSchema,
} from "./schema"
import {
    MAX_DATA_REPAIRS,
    MAX_TOOL_CALLS,
    MAX_TOOL_CONTENT_TOKENS,
} from "./constants"
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
    ChatCompletionUsage,
    ChatCompletionUserMessageParam,
    CreateChatCompletionRequest,
} from "./chattypes"
import {
    renderMessageContent,
    renderMessagesToMarkdown,
    renderShellOutput,
} from "./chatrender"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { fenceMD, prettifyMarkdown } from "./markdown"
import { YAMLStringify } from "./yaml"
import { resolveTokenEncoder } from "./encoders"
import { estimateTokens, truncateTextToTokens } from "./tokens"
import { computeFileEdits } from "./fileedits"

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
    const { cancellationToken, trace, model } = options || {}
    const encoder = await resolveTokenEncoder(model)
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
                        throw new Error(
                            `multi tool ${toolName} not found in ${tools.map((t) => t.spec.name).join(", ")}`
                        )
                    }
                    return { tool, args: tu.parameters }
                })
            } else {
                let tool = tools.find((f) => f.spec.name === call.name)
                if (!tool) {
                    logVerbose(JSON.stringify(call, null, 2))
                    logVerbose(
                        `tool ${call.name} not found in ${tools.map((t) => t.spec.name).join(", ")}`
                    )
                    tool = {
                        spec: {
                            name: call.name,
                            description: "unknown tool",
                        },
                        impl: async () => "unknown tool",
                    }
                }
                todos = [{ tool, args: callArgs }]
            }

            const toolResult: string[] = []
            for (const todo of todos) {
                const { tool, args } = todo
                const {
                    maxTokens: maxToolContentTokens = MAX_TOOL_CONTENT_TOKENS,
                } = tool.options || {}
                const context: ToolCallContext = {
                    log: (txt: string) => {
                        logVerbose(txt)
                        trace.log(txt)
                    },
                    trace,
                }

                let output: ToolCallOutput
                try {
                    output = await tool.impl({ context, ...args })
                } catch (e) {
                    logWarn(`tool: ${tool.spec.name} error`)
                    trace.error(`tool: ${tool.spec.name} error`, e)
                    output = errorMessage(e)
                }
                if (output === undefined || output === null)
                    throw new Error(
                        `error: tool ${tool.spec.name} raised an error`
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
                    toolContent = renderShellOutput(output as ShellOutput)
                } else if (
                    typeof output === "object" &&
                    (output as WorkspaceFile).filename &&
                    (output as WorkspaceFile).content
                ) {
                    const { filename, content } = output as WorkspaceFile
                    toolContent = `FILENAME: ${filename}
${fenceMD(content, " ")}
`
                } else if (
                    typeof output === "object" &&
                    (output as RunPromptResult).text
                ) {
                    const { text } = output as RunPromptResult
                    toolContent = text
                } else {
                    toolContent = YAMLStringify(output)
                }

                if (typeof output === "object")
                    toolEdits = (output as ToolCallContent)?.edits

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

                const toolContentTokens = estimateTokens(toolContent, encoder)
                if (toolContentTokens > maxToolContentTokens) {
                    logWarn(
                        `tool: ${tool.spec.name} response too long (${toolContentTokens} tokens), truncating ${maxToolContentTokens} tokens`
                    )
                    toolContent = truncateTextToTokens(
                        toolContent,
                        maxToolContentTokens,
                        encoder
                    )
                }
                trace.fence(toolContent, "markdown")
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
    const invalids = fences.filter((f) => f?.validation?.schemaError)

    if (responseSchema) {
        const value = JSONLLMTryParse(content)
        const schema = promptParametersSchemaToJSONSchema(responseSchema)
        const res = validateJSONWithSchema(value, schema, { trace })
        if (res.schemaError)
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
error: ${f.validation.schemaError}`
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

async function structurifyChatSession(
    messages: ChatCompletionMessageParam[],
    schemas: Record<string, JSONSchema>,
    genVars: Record<string, string>,
    fileOutputs: FileOutput[],
    outputProcessors: PromptOutputProcessorHandler[],
    fileMerges: FileMergeHandler[],
    options: GenerationOptions,
    others?: {
        resp?: ChatCompletionResponse
        err?: any
    }
): Promise<RunPromptResult> {
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
                if (res.schemaError) {
                    trace.fence(schema, "json")
                    trace?.warn(
                        `response schema validation failed, ${errorMessage(res.schemaError)}`
                    )
                }
            }
        } catch (e) {
            trace.error("response json_object parsing failed", e)
        }
    } else {
        json = isJSONObjectOrArray(text)
            ? JSONLLMTryParse(text)
            : findFirstDataFence(fences)
    }
    const frames: DataFrame[] = []

    // validate schemas in fences
    if (fences?.length)
        frames.push(...validateFencesWithSchema(fences, schemas, { trace }))

    const res: RunPromptResult = {
        messages,
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
    await computeFileEdits(res, {
        trace,
        schemas,
        fileOutputs,
        fileMerges,
        outputProcessors,
    })
    return res
}

async function processChatMessage(
    req: CreateChatCompletionRequest,
    resp: ChatCompletionResponse,
    messages: ChatCompletionMessageParam[],
    tools: ToolCallback[],
    chatParticipants: ChatParticipant[],
    schemas: Record<string, JSONSchema>,
    genVars: Record<string, string>,
    fileOutputs: FileOutput[],
    outputProcessors: PromptOutputProcessorHandler[],
    fileMerges: FileMergeHandler[],
    options: GenerationOptions
): Promise<RunPromptResult> {
    const {
        stats,
        maxToolCalls = MAX_TOOL_CALLS,
        trace,
        cancellationToken,
    } = options

    stats.addUsage(req, resp.usage)

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
                const { errors, userPrompt } = await renderPromptNode(
                    options.model,
                    node,
                    {
                        flexTokens: options.flexTokens,
                        trace,
                    }
                )
                if (userPrompt?.trim().length) {
                    trace.detailsFenced(`💬 message`, userPrompt, "markdown")
                    messages.push({ role: "user", content: userPrompt })
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

    return structurifyChatSession(
        messages,
        schemas,
        genVars,
        fileOutputs,
        outputProcessors,
        fileMerges,
        options,
        {
            resp,
        }
    )
}

export function mergeGenerationOptions(
    options: GenerationOptions,
    runOptions: ModelOptions & EmbeddingsModelOptions
): GenerationOptions {
    const res = {
        ...options,
        ...(runOptions || {}),
        model:
            runOptions?.model ??
            options?.model ??
            host.defaultModelOptions.model,
        smallModel:
            runOptions?.smallModel ??
            options?.smallModel ??
            host.defaultModelOptions.smallModel,
        temperature:
            runOptions?.temperature ?? host.defaultModelOptions.temperature,
        embeddingsModel:
            runOptions?.embeddingsModel ??
            options?.embeddingsModel ??
            host.defaultEmbeddingsModelOptions.embeddingsModel,
    }
    return res
}

export async function executeChatSession(
    connectionToken: LanguageModelConfiguration,
    cancellationToken: CancellationToken,
    messages: ChatCompletionMessageParam[],
    toolDefinitions: ToolCallback[],
    schemas: Record<string, JSONSchema>,
    fileOutputs: FileOutput[],
    outputProcessors: PromptOutputProcessorHandler[],
    fileMerges: FileMergeHandler[],
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
        infoCb,
        stats,
    } = genOptions
    traceLanguageModelConnection(trace, genOptions, connectionToken)
    const tools: ChatCompletionTool[] = toolDefinitions?.length
        ? toolDefinitions.map(
              (f) =>
                  <ChatCompletionTool>{
                      type: "function",
                      function: {
                          name: f.spec.name,
                          description: f.spec.description,
                          parameters: f.spec.parameters as any,
                      },
                  }
          )
        : undefined
    trace.startDetails(`🧠 llm chat`)
    if (toolDefinitions?.length) trace.detailsFenced(`🛠️ tools`, tools, "yaml")
    try {
        let genVars: Record<string, string>
        while (true) {
            stats.turns++
            const tokens = estimateChatTokens(model, messages)
            infoCb?.({
                text: `prompting ${model} (~${tokens ?? "?"} tokens)`,
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
                const req: CreateChatCompletionRequest = {
                    model,
                    temperature: temperature,
                    top_p: topP,
                    max_tokens: maxTokens,
                    max_completion_tokens: maxTokens,
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
                }
                if (model === "gpt-4-32k") delete req.max_completion_tokens
                try {
                    trace.startDetails(`📤 llm request`)
                    resp = await completer(
                        req,
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
                    req,
                    resp,
                    messages,
                    toolDefinitions,
                    chatParticipants,
                    schemas,
                    genVars,
                    fileOutputs,
                    outputProcessors,
                    fileMerges,
                    genOptions
                )
                if (output) return output
            } catch (err) {
                return structurifyChatSession(
                    messages,
                    schemas,
                    genVars,
                    fileOutputs,
                    outputProcessors,
                    fileMerges,
                    genOptions,
                    { resp, err }
                )
            }
        }
    } finally {
        stats.trace(trace)
        trace.endDetails()
    }
}

export function tracePromptResult(trace: MarkdownTrace, resp: RunPromptResult) {
    const { json, text } = resp
    trace.details(`🔠 output`, prettifyMarkdown(text), { expanded: true })
    if (resp.json) trace.detailsFenced("📩 JSON (parsed)", json, "json")
}
