// cspell: disable
import { MarkdownTrace } from "./trace"
import { PromptImage, PromptPrediction, renderPromptNode } from "./promptdom"
import { LanguageModelConfiguration, host } from "./host"
import { GenerationOptions } from "./generation"
import {
    JSON5TryParse,
    JSON5parse,
    JSONLLMTryParse,
    isJSONObjectOrArray,
} from "./json5"
import {
    CancellationOptions,
    CancellationToken,
    checkCancelled,
} from "./cancellation"
import {
    arrayify,
    assert,
    deleteUndefinedValues,
    logError,
    logInfo,
    logVerbose,
    logWarn,
    roundWithPrecision,
} from "./util"
import { extractFenced, findFirstDataFence, unfence } from "./fence"
import {
    toStrictJSONSchema,
    validateFencesWithSchema,
    validateJSONWithSchema,
} from "./schema"
import {
    CHOICE_LOGIT_BIAS,
    MAX_DATA_REPAIRS,
    MAX_TOOL_CALLS,
    MAX_TOOL_CONTENT_TOKENS,
    SYSTEM_FENCE,
} from "./constants"
import { parseAnnotations } from "./annotations"
import { errorMessage, isCancelError, serializeError } from "./error"
import { estimateChatTokens } from "./chatencoder"
import { createChatTurnGenerationContext } from "./runpromptcontext"
import { dedent } from "./indent"
import { traceLanguageModelConnection } from "./models"
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionContentPartImage,
    ChatCompletionMessageParam,
    ChatCompletionResponse,
    ChatCompletionsOptions,
    ChatCompletionSystemMessageParam,
    ChatCompletionTool,
    ChatCompletionToolCall,
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
import { HTMLEscape } from "./html"
import { XMLTryParse } from "./xml"
import {
    computePerplexity,
    logprobToMarkdown,
    serializeLogProb,
    topLogprobsToMarkdown,
} from "./logprob"

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
    const { encode: encoder } = await resolveTokenEncoder(model)
    assert(!!trace)
    let edits: Edits[] = []

    if (!options.fallbackTools)
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
    else {
        // pop the last assistant message
        appendUserMessage(messages, "## Tool Results (computed by tools)")
    }

    // call tool and run again
    for (const call of resp.toolCalls) {
        checkCancelled(cancellationToken)
        const toolTrace = trace.startTraceDetails(`📠 tool call ${call.name}`)
        try {
            await runToolCall(
                trace,
                call,
                tools,
                edits,
                projFolder,
                encoder,
                messages,
                options
            )
        } catch (e) {
            logError(e)
            toolTrace.error(`tool call ${call.id} error`, e)
            throw e
        } finally {
            toolTrace.endDetails()
        }
    }

    return { edits }
}

async function runToolCall(
    trace: MarkdownTrace,
    call: ChatCompletionToolCall,
    tools: ToolCallback[],
    edits: Edits[],
    projFolder: string,
    encoder: TokenEncoder,
    messages: ChatCompletionMessageParam[],
    options: GenerationOptions
) {
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
            const toolName = tu.recipient_name.replace(/^functions\./, "")
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
            trace.log(`tool ${call.name} not found`)
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
        logVerbose(`tool: ${tool.spec.name}`)
        const { maxTokens: maxToolContentTokens = MAX_TOOL_CONTENT_TOKENS } =
            tool.options || {}
        const context: ToolCallContext = {
            log: (message: string) => {
                logInfo(message)
                trace.log(message)
            },
            debug: (message: string) => {
                logVerbose(message)
                trace.log(message)
            },
            trace,
        }

        let output: ToolCallOutput
        try {
            output = await tool.impl({ context, ...args })
        } catch (e) {
            logWarn(`tool: ${tool.spec.name} error`)
            logError(e)
            trace.error(`tool: ${tool.spec.name} error`, e)
            output = errorMessage(e)
        }
        if (output === undefined || output === null)
            throw new Error(`error: tool ${tool.spec.name} raised an error`)
        let toolContent: string = undefined
        let toolEdits: Edits[] = undefined
        if (typeof output === "string") toolContent = output
        else if (typeof output === "number" || typeof output === "boolean")
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
            toolContent =
                truncateTextToTokens(
                    toolContent,
                    maxToolContentTokens,
                    encoder
                ) + "... (truncated)"
        }
        trace.fence(toolContent, "markdown")
        toolResult.push(toolContent)
    }

    if (options.fallbackTools)
        appendUserMessage(
            messages,
            `- ${call.name}(${JSON.stringify(call.arguments || {})})
\`\`\`\`\`
${toolResult.join("\n\n")}
\`\`\`\`\`
`
        )
    else
        messages.push({
            role: "tool",
            content: toolResult.join("\n\n"),
            tool_call_id: call.id,
        })
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
    logprobs: Logprob[],
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

    const perplexity = computePerplexity(logprobs)
    if (logprobs?.length) {
        logVerbose(
            `${logprobs.length} tokens, perplexity: ${roundWithPrecision(perplexity, 3) || ""}`
        )
        try {
            trace.startDetails("📊 logprobs")
            trace.itemValue("perplexity", perplexity)
            trace.item("logprobs (0%:red, 100%: blue)")
            trace.appendContent("\n\n")
            trace.appendContent(
                logprobs.map((lp) => logprobToMarkdown(lp)).join("\n")
            )
            trace.appendContent("\n\n")
            if (!isNaN(logprobs[0].entropy)) {
                trace.item("entropy (0:red, 1: blue)")
                trace.appendContent("\n\n")
                trace.appendContent(
                    logprobs
                        .map((lp) => logprobToMarkdown(lp, { entropy: true }))
                        .join("\n")
                )
                trace.appendContent("\n\n")
            }
            if (logprobs[0]?.topLogprobs?.length) {
                trace.item("top_logprobs")
                trace.appendContent("\n\n")
                trace.appendContent(
                    logprobs.map((lp) => topLogprobsToMarkdown(lp)).join("\n")
                )
                trace.appendContent("\n\n")
            }
        } finally {
            trace.endDetails()
        }
    }

    const res: RunPromptResult = deleteUndefinedValues({
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
        logprobs,
        perplexity,
        model: resp?.model,
    } satisfies RunPromptResult)
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

    stats.addUsage(req, resp)

    if (resp.text)
        messages.push({
            role: "assistant",
            content: resp.text,
        })

    if (options.fallbackTools && resp.text && tools.length) {
        resp.toolCalls = []
        // parse tool call
        const toolCallFences = extractFenced(resp.text).filter((f) =>
            /^tool_calls?$/.test(f.language)
        )
        for (const toolCallFence of toolCallFences) {
            for (const toolCall of toolCallFence.content.split("\n")) {
                const { name, args } =
                    /^(?<name>[\w\d]+):\s*(?<args>\{.*\})\s*$/i.exec(toolCall)
                        ?.groups || {}
                if (name) {
                    resp.toolCalls.push({
                        id: undefined,
                        name,
                        arguments: args,
                    } satisfies ChatCompletionToolCall)
                }
            }
        }
    }

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

    let err: any
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
                const { errors, messages: participantMessages } =
                    await renderPromptNode(options.model, node, {
                        flexTokens: options.flexTokens,
                        trace,
                    })
                if (participantMessages?.length) {
                    if (
                        participantMessages.some(
                            ({ role }) => role === "system"
                        )
                    )
                        throw new Error(
                            "system messages not supported for chat participants"
                        )
                    renderMessagesToMarkdown(participantMessages, {
                        user: true,
                        assistant: true,
                    })
                    trace.details(
                        `💬 messages (${participantMessages.length})`,
                        renderMessagesToMarkdown(participantMessages, {
                            user: true,
                            assistant: true,
                        }),
                        { expanded: true }
                    )
                    messages.push(...participantMessages)
                    needsNewTurn = true
                } else trace.item("no message")
                if (errors?.length) {
                    err = errors[0]
                    for (const error of errors) trace.error(undefined, error)
                    needsNewTurn = false
                    break
                }
            } catch (e) {
                err = e
                logError(e)
                trace.error(`participant error`, e)
                needsNewTurn = false
                break
            } finally {
                trace?.endDetails()
            }
        }
        if (needsNewTurn) return undefined
    }

    const logprobs = resp.logprobs?.map(serializeLogProb)
    return structurifyChatSession(
        messages,
        schemas,
        genVars,
        fileOutputs,
        outputProcessors,
        fileMerges,
        logprobs,
        options,
        {
            resp,
            err,
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
        visionModel:
            runOptions?.visionModel ??
            options?.visionModel ??
            host.defaultModelOptions.visionModel,
        temperature:
            runOptions?.temperature ?? host.defaultModelOptions.temperature,
        embeddingsModel:
            runOptions?.embeddingsModel ??
            options?.embeddingsModel ??
            host.defaultEmbeddingsModelOptions.embeddingsModel,
    } satisfies GenerationOptions
    return res
}

async function choicesToLogitBias(
    trace: MarkdownTrace,
    model: string,
    choices: ElementOrArray<string>
) {
    choices = arrayify(choices)
    if (!choices?.length) return undefined
    const { encode } = await resolveTokenEncoder(model, {
        disableFallback: true,
    })
    if (!encode) {
        trace.error(
            `unabled to compute logit bias, no token encoder found for ${model}`
        )
        return undefined
    }
    const res = Object.fromEntries(
        choices.map((c) => {
            const tokens = encode(c)
            if (tokens.length !== 1)
                trace.warn(
                    `choice ${c} tokenizes to ${tokens.join(", ")} (expected one token)`
                )
            return [tokens[0], CHOICE_LOGIT_BIAS]
        })
    )
    trace.itemValue("choices", choices.join(", "))
    trace.itemValue("logit bias", JSON.stringify(res))
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
    prediction: PromptPrediction,
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
        fallbackTools,
        choices,
        topLogprobs,
    } = genOptions
    const top_logprobs = genOptions.topLogprobs > 0 ? topLogprobs : undefined
    const logprobs = genOptions.logprobs || top_logprobs > 0 ? true : undefined
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
    try {
        trace.startDetails(`🧠 llm chat`)
        if (toolDefinitions?.length)
            trace.detailsFenced(`🛠️ tools`, tools, "yaml")
        let genVars: Record<string, string>
        while (true) {
            stats.turns++
            const tokens = estimateChatTokens(model, messages)
            logVerbose(`prompting ${model} (~${tokens ?? "?"} tokens)\n`)
            if (messages)
                trace.details(
                    `💬 messages (${messages.length})`,
                    renderMessagesToMarkdown(messages, {
                        user: true,
                        assistant: true,
                    }),
                    { expanded: true }
                )

            // make request
            let req: CreateChatCompletionRequest
            let resp: ChatCompletionResponse
            try {
                checkCancelled(cancellationToken)
                try {
                    trace.startDetails(`📤 llm request`)
                    const logit_bias = await choicesToLogitBias(
                        trace,
                        model,
                        choices
                    )
                    req = {
                        model,
                        temperature: temperature,
                        top_p: topP,
                        max_tokens: maxTokens,
                        logit_bias,
                        seed,
                        stream: true,
                        logprobs,
                        top_logprobs,
                        messages,
                        tools: fallbackTools ? undefined : tools,
                        // https://platform.openai.com/docs/guides/predicted-outputs
                        prediction: prediction?.content
                            ? prediction
                            : undefined,
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
                    if (/^o1/i.test(model)) {
                        req.max_completion_tokens = maxTokens
                        delete req.max_tokens
                    }
                    resp = await completer(
                        req,
                        connectionToken,
                        genOptions,
                        trace
                    )
                    if (resp.variables)
                        genVars = { ...(genVars || {}), ...resp.variables }
                } finally {
                    logVerbose("\n")
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
                    [],
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

    // try to sniff the output type
    const language = JSON5TryParse(text)
        ? "json"
        : XMLTryParse(text)
          ? "xml"
          : /^(-|\*|#+|```)\s/im.test(text)
            ? "markdown"
            : "text"
    trace.detailsFenced(`🔠 output`, text, language)
    if (language === "markdown")
        trace.appendContent(
            "\n\n" + HTMLEscape(prettifyMarkdown(text)) + "\n\n"
        )
}

export function appendUserMessage(
    messages: ChatCompletionMessageParam[],
    content: string
) {
    if (!content) return
    const last = messages.at(-1) as ChatCompletionUserMessageParam
    if (last?.role === "user") last.content += "\n" + content
    else
        messages.push({
            role: "user",
            content,
        } as ChatCompletionUserMessageParam)
}

export function appendAssistantMessage(
    messages: ChatCompletionMessageParam[],
    content: string
) {
    if (!content) return
    const last = messages.at(-1) as ChatCompletionAssistantMessageParam
    if (last?.role === "assistant") last.content += "\n" + content
    else
        messages.push({
            role: "assistant",
            content,
        } satisfies ChatCompletionAssistantMessageParam)
}

export function appendSystemMessage(
    messages: ChatCompletionMessageParam[],
    content: string
) {
    if (!content) return
    let last = messages[0] as ChatCompletionSystemMessageParam
    if (last?.role !== "system") {
        last = {
            role: "system",
            content: "",
        } as ChatCompletionSystemMessageParam
        messages.unshift(last)
    }
    if (last.content) last.content += SYSTEM_FENCE
    last.content += content
}

export function addToolDefinitionsMessage(
    messages: ChatCompletionMessageParam[],
    tools: ToolCallback[]
) {
    appendSystemMessage(
        messages,
        `
TOOLS:
\`\`\`yaml
${YAMLStringify(tools.map((t) => t.spec))}
\`\`\`
`
    )
}
