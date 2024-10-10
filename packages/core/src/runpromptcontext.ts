import {
    PromptNode,
    appendChild,
    createAssistantNode,
    createChatParticipant,
    createDefData,
    createDefDiff,
    createDef,
    createFileOutput,
    createToolNode,
    createImageNode,
    createImportTemplate,
    createSchemaNode,
    createStringTemplateNode,
    createTextNode,
    renderPromptNode,
    createOutputProcessor,
    createFileMerge,
} from "./promptdom"
import { MarkdownTrace } from "./trace"
import { GenerationOptions } from "./generation"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { consoleLogFormat } from "./logging"
import { isGlobMatch } from "./glob"
import { arrayify, logError, logVerbose } from "./util"
import { renderShellOutput } from "./chatrender"
import { jinjaRender } from "./jinja"
import { mustacheRender } from "./mustache"
import { imageEncodeForLLM } from "./image"
import { delay, uniq } from "es-toolkit"
import {
    executeChatSession,
    mergeGenerationOptions,
    tracePromptResult,
} from "./chat"
import { checkCancelled } from "./cancellation"
import {
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
} from "./chattypes"
import { parseModelIdentifier, resolveModelConnectionInfo } from "./models"
import {
    CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT,
    MODEL_PROVIDER_AICI,
    SYSTEM_FENCE,
} from "./constants"
import { renderAICI } from "./aici"
import { resolveSystems, resolveTools } from "./systems"
import { callExpander } from "./expander"
import {
    errorMessage,
    isCancelError,
    NotSupportedError,
    serializeError,
} from "./error"
import { resolveLanguageModel } from "./lm"
import { concurrentLimit } from "./concurrency"
import { Project } from "./ast"
import { dedent } from "./indent"
import { runtimeHost } from "./host"
import { writeFileEdits } from "./fileedits"
import { agentAddMemory, defMemory } from "./agent"

export function createChatTurnGenerationContext(
    options: GenerationOptions,
    trace: MarkdownTrace
): ChatTurnGenerationContext & { node: PromptNode } {
    const node: PromptNode = { children: [] }

    const log = (...args: any[]) => {
        const line = consoleLogFormat(...args)
        if (line) {
            trace.log(line)
            logVerbose(line)
        }
    }
    const console = Object.freeze<PromptGenerationConsole>({
        log,
        debug: log,
        warn: log,
        error: log,
    })

    const ctx = <ChatTurnGenerationContext & { node: PromptNode }>{
        node,
        writeText: (body, options) => {
            if (body !== undefined && body !== null) {
                const { priority, maxTokens } = options || {}
                appendChild(
                    node,
                    options?.assistant
                        ? createAssistantNode(body, { priority, maxTokens })
                        : createTextNode(body, { priority, maxTokens })
                )
            }
        },
        assistant: (body, options) =>
            ctx.writeText(body, { ...options, assistant: true }),
        $: (strings, ...args) => {
            const current = createStringTemplateNode(strings, args)
            appendChild(node, current)
            const res: PromptTemplateString = Object.freeze(<
                PromptTemplateString
            >{
                priority: (priority) => {
                    current.priority = priority
                    return res
                },
                flex: (value) => {
                    current.flex = value
                    return res
                },
                jinja: (data) => {
                    current.transforms.push((t) => jinjaRender(t, data))
                    return res
                },
                mustache: (data) => {
                    current.transforms.push((t) => mustacheRender(t, data))
                    return res
                },
                maxTokens: (tokens) => {
                    current.maxTokens = tokens
                    return res
                },
            })
            return res
        },
        def: (name, body, defOptions) => {
            name = name ?? ""
            const doptions = { ...(defOptions || {}), trace }
            doptions.lineNumbers = doptions.lineNumbers ?? options.lineNumbers
            // shortcuts
            if (body === undefined || body === null) {
                if (!doptions.ignoreEmpty)
                    throw new Error(`def ${name} is ${body}`)
                return undefined
            } else if (Array.isArray(body)) {
                if (body.length === 0 && !doptions.ignoreEmpty)
                    throw new Error(`def ${name} is empty`)
                body.forEach((f) => ctx.def(name, f, defOptions))
            } else if (typeof body === "string") {
                if (body.trim() === "" && !doptions.ignoreEmpty)
                    throw new Error(`def ${name} is empty`)
                appendChild(
                    node,
                    createDef(name, { filename: "", content: body }, doptions)
                )
            } else if (
                typeof body === "object" &&
                (body as WorkspaceFile).filename
            ) {
                const file = body as WorkspaceFile
                const { glob } = defOptions || {}
                const endsWith = arrayify(defOptions?.endsWith)
                const { filename } = file
                if (glob && filename) {
                    if (!isGlobMatch(filename, glob)) return undefined
                }
                if (
                    endsWith.length &&
                    !endsWith.some((ext) => filename.endsWith(ext))
                )
                    return undefined
                appendChild(node, createDef(name, file, doptions))
            } else if (
                typeof body === "object" &&
                (body as ShellOutput).exitCode !== undefined
            ) {
                appendChild(
                    node,
                    createDef(
                        name,
                        {
                            filename: "",
                            content: renderShellOutput(body as ShellOutput),
                        },
                        { ...doptions, lineNumbers: false }
                    )
                )
            } else if (typeof body === "object" && (body as Fenced).content) {
                const fenced = body as Fenced
                appendChild(
                    node,
                    createDef(
                        name,
                        { filename: "", content: fenced.content },
                        { language: fenced.language, ...(doptions || {}) }
                    )
                )
            } else if (
                typeof body === "object" &&
                (body as RunPromptResult).text
            ) {
                const res = body as RunPromptResult
                const fence =
                    res.fences?.length === 1 ? res.fences[0] : undefined
                appendChild(
                    node,
                    createDef(
                        name,
                        { filename: "", content: fence?.content ?? res.text },
                        { language: fence?.language, ...(doptions || {}) }
                    )
                )
            }

            // TODO: support clause
            return name
        },
        defData: (name, data, defOptions) => {
            appendChild(node, createDefData(name, data, defOptions))
            return name
        },
        defDiff: (name, left, right, defDiffOptions) => {
            appendChild(node, createDefDiff(name, left, right, defDiffOptions))
            return name
        },
        fence(body, options?: DefOptions) {
            ctx.def("", body, options)
            return undefined
        },
        importTemplate: (template, data, options) => {
            appendChild(node, createImportTemplate(template, data, options))
            return undefined
        },
        console,
    }

    return ctx
}

export interface RunPromptContextNode extends ChatGenerationContext {
    node: PromptNode
}

export function createChatGenerationContext(
    options: GenerationOptions,
    trace: MarkdownTrace,
    projectOptions: {
        prj: Project
        env: ExpansionVariables
    }
): RunPromptContextNode {
    const { cancellationToken, infoCb } = options || {}
    const { prj, env } = projectOptions
    const turnCtx = createChatTurnGenerationContext(options, trace)
    const node = turnCtx.node

    // Default output processor for the prompt
    const defOutputProcessor = (fn: PromptOutputProcessorHandler) => {
        if (fn) appendChild(node, createOutputProcessor(fn))
    }

    const defTool: (
        name:
            | string
            | ToolCallback
            | AgenticToolCallback
            | AgenticToolProviderCallback,
        description: string,
        parameters: PromptParametersSchema | JSONSchemaObject,
        fn: ChatFunctionHandler,
        defOptions?: DefToolOptions
    ) => void = (name, description, parameters, fn, defOptions) => {
        if (name === undefined || name === null)
            throw new Error("tool name is missing")

        if (typeof name === "string") {
            const parameterSchema =
                promptParametersSchemaToJSONSchema(parameters)
            appendChild(
                node,
                createToolNode(
                    name,
                    description,
                    parameterSchema,
                    fn,
                    defOptions
                )
            )
        } else if ((name as ToolCallback | AgenticToolCallback).impl) {
            const tool = name as ToolCallback | AgenticToolCallback
            appendChild(
                node,
                createToolNode(
                    tool.spec.name,
                    tool.spec.description,
                    tool.spec.parameters as any,
                    tool.impl,
                    defOptions
                )
            )
        } else if ((name as AgenticToolProviderCallback).functions) {
            const tools = (name as AgenticToolProviderCallback).functions
            for (const tool of tools)
                appendChild(
                    node,
                    createToolNode(
                        tool.spec.name,
                        tool.spec.description,
                        tool.spec.parameters as any,
                        tool.impl,
                        defOptions
                    )
                )
        }
    }

    const defAgent = (
        name: string,
        description: string,
        fn: (
            agentCtx: ChatGenerationContext,
            args: ChatFunctionArgs
        ) => Promise<void>,
        options?: DefAgentOptions
    ): void => {
        const { tools, system, disableMemory, disableMemoryQuery, ...rest } =
            options || {}
        const memory = !disableMemory

        name = name.replace(/^agent_/i, "")
        const agentName = `agent_${name}`
        const agentLabel = `agent ${name}`

        const agentSystem = uniq([
            "system.tools",
            "system.explanations",
            ...arrayify(system),
        ])
        const agentTools = resolveTools(
            runtimeHost.project,
            agentSystem,
            [...arrayify(tools), memory ? "agent_memory" : undefined].filter(
                (t) => !!t
            )
        )
        const agentDescription = dedent`Agent that uses an LLM to ${description}.\nAvailable tools: 
        ${agentTools.map((t) => `- ${t.description}`).join("\n")}` // DO NOT LEAK TOOL ID HERE

        defTool(
            agentName,
            agentDescription,
            {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Query to answer by the LLM agent.",
                    },
                },
                required: ["query"],
            },
            async (args) => {
                const { context, query } = args
                context.log(`${agentLabel}: ${query}`)

                let memoryAnswer: string
                if (memory && query && !disableMemoryQuery) {
                    // always pre-query memory with cheap model
                    const res = await ctx.runPrompt(
                        async (_) => {
                            _.$`Answer QUERY with a summary of the information from MEMORY.
                            - If you are missing information, return <NO_INFORMATION>.
                            - Use QUERY as the only source of information.
                            - Be concise. Keep it short. The output is used by another LLM.
                            - Provide important details like identifiers and names.
                            `
                            _.def("QUERY", query)
                            await defMemory(_)
                        },
                        {
                            model: "small",
                            system: ["system"],
                            flexTokens: 20000,
                            label: "agent memory query",
                        }
                    )
                    if (!res.error) memoryAnswer = res.text
                    else
                        logVerbose(
                            `agent memory query error: ${errorMessage(res.error)}`
                        )
                }

                const res = await ctx.runPrompt(
                    async (_) => {
                        if (typeof fn === "string") _.writeText(dedent(fn))
                        else await fn(_, args)
                        _.$`Make a plan and solve this task.
                        
                - Assume that your answer will be analyzed by an LLM, not a human.
                - If you are missing information, reply "MISSING_INFO: <what is missing>".
                - If you cannot answer the query, return "NO_ANSWER: <reason>".
                - Be concise. Minimize output to the most relevant information to save context tokens.`
                        if (memoryAnswer)
                            _.$`- The query applied to the agent memory is in MEMORY.`
                        _.def("QUERY", query)
                        if (memoryAnswer) _.def("MEMORY", memoryAnswer)
                        if (memory)
                            _.defOutputProcessor(async ({ text }) => {
                                if (
                                    text &&
                                    !/MISSING_INFO|NO_ANSWER/.test(text)
                                )
                                    await agentAddMemory(
                                        agentName,
                                        query,
                                        text,
                                        trace
                                    )
                            })
                    },
                    {
                        label: agentLabel,
                        system: agentSystem,
                        tools: agentTools.map(({ id }) => id),
                        ...rest,
                    }
                )
                return res
            }
        )
    }

    const defSchema = (
        name: string,
        schema: JSONSchema,
        defOptions?: DefSchemaOptions
    ) => {
        appendChild(node, createSchemaNode(name, schema, defOptions))

        return name
    }

    const defImages = (
        files: ElementOrArray<string | WorkspaceFile | Buffer | Blob>,
        defOptions?: DefImagesOptions
    ) => {
        const { detail } = defOptions || {}
        if (Array.isArray(files))
            files.forEach((file) => defImages(file, defOptions))
        else if (
            typeof files === "string" ||
            files instanceof Blob ||
            files instanceof Buffer
        ) {
            const img = files
            appendChild(
                node,
                createImageNode(
                    (async () => {
                        const url = await imageEncodeForLLM(img, {
                            ...defOptions,
                            trace,
                        })
                        return {
                            url,
                            detail,
                        }
                    })()
                )
            )
        } else {
            const file: WorkspaceFile = files
            appendChild(
                node,
                createImageNode(
                    (async () => {
                        const url = await imageEncodeForLLM(file.filename, {
                            ...defOptions,
                            trace,
                        })
                        return {
                            url,
                            filename: file.filename,
                            detail,
                        }
                    })()
                )
            )
        }
    }

    const defChatParticipant = (
        generator: ChatParticipantHandler,
        options?: ChatParticipantOptions
    ) => {
        if (generator)
            appendChild(node, createChatParticipant({ generator, options }))
    }

    const defFileOutput = (
        pattern: ElementOrArray<string | WorkspaceFile>,
        description: string,
        options?: FileOutputOptions
    ): void => {
        if (pattern)
            appendChild(
                node,
                createFileOutput({
                    pattern: arrayify(pattern).map((p) =>
                        typeof p === "string" ? p : p.filename
                    ),
                    description,
                    options,
                })
            )
    }

    const prompt = (
        strings: TemplateStringsArray,
        ...args: any[]
    ): RunPromptResultPromiseWithOptions => {
        const options: PromptGeneratorOptions = {}
        const p: RunPromptResultPromiseWithOptions =
            new Promise<RunPromptResult>(async (resolve, reject) => {
                try {
                    await delay(0)
                    // data race for options
                    const res = await ctx.runPrompt(async (_) => {
                        _.$(strings, ...args)
                    }, options)
                    resolve(res)
                } catch (e) {
                    reject(e)
                }
            }) as any
        p.options = (v) => {
            if (v !== undefined) Object.assign(options, v)
            return p
        }
        return p
    }

    const runPrompt = async (
        generator: string | PromptGenerator,
        runOptions?: PromptGeneratorOptions
    ): Promise<RunPromptResult> => {
        const { label, applyEdits } = runOptions || {}
        const runTrace = trace.startTraceDetails(`🎁 run prompt ${label || ""}`)
        try {
            infoCb?.({ text: `run prompt ${label || ""}` })

            const genOptions = mergeGenerationOptions(options, runOptions)
            genOptions.inner = true
            genOptions.trace = runTrace
            const { info } = await resolveModelConnectionInfo(genOptions, {
                trace,
                token: true,
            })
            if (info.error) throw new Error(info.error)
            genOptions.model = info.model
            genOptions.stats = genOptions.stats.createChild(
                genOptions.model,
                label
            )

            const ctx = createChatGenerationContext(
                genOptions,
                runTrace,
                projectOptions
            )
            if (typeof generator === "string")
                ctx.node.children.push(createTextNode(generator))
            else await generator(ctx)
            const node = ctx.node

            checkCancelled(cancellationToken)

            let messages: ChatCompletionMessageParam[] = []
            let tools: ToolCallback[] = undefined
            let schemas: Record<string, JSONSchema> = undefined
            let chatParticipants: ChatParticipant[] = undefined
            const fileMerges: FileMergeHandler[] = []
            const outputProcessors: PromptOutputProcessorHandler[] = []
            const fileOutputs: FileOutput[] = []

            // expand template
            const { provider } = parseModelIdentifier(genOptions.model)
            if (provider === MODEL_PROVIDER_AICI) {
                const { aici } = await renderAICI("prompt", node)
                // todo: output processor?
                messages.push(aici)
            } else {
                const {
                    errors,
                    schemas: scs,
                    functions: fns,
                    messages: msgs,
                    chatParticipants: cps,
                    fileMerges: fms,
                    outputProcessors: ops,
                    fileOutputs: fos,
                } = await renderPromptNode(genOptions.model, node, {
                    flexTokens: genOptions.flexTokens,
                    trace: runTrace,
                })

                schemas = scs
                tools = fns
                chatParticipants = cps
                messages.push(...msgs)
                fileMerges.push(...fms)
                outputProcessors.push(...ops)
                fileOutputs.push(...fos)

                if (errors?.length) {
                    logError(errors.map((err) => errorMessage(err)).join("\n"))
                    throw new Error("errors while running prompt")
                }
            }

            const systemMessage: ChatCompletionSystemMessageParam = {
                role: "system",
                content: "",
            }
            const systemScripts = resolveSystems(prj, runOptions ?? {})
            if (systemScripts.length)
                try {
                    trace.startDetails("👾 systems")
                    for (const systemId of systemScripts) {
                        checkCancelled(cancellationToken)

                        const system = prj.getTemplate(systemId)
                        if (!system)
                            throw new Error(
                                `system template ${systemId} not found`
                            )
                        runTrace.startDetails(`👾 ${system.id}`)
                        const sysr = await callExpander(
                            prj,
                            system,
                            env,
                            runTrace,
                            genOptions
                        )
                        if (sysr.images?.length)
                            throw new NotSupportedError("images")
                        if (sysr.schemas) Object.assign(schemas, sysr.schemas)
                        if (sysr.functions) tools.push(...sysr.functions)
                        if (sysr.fileMerges?.length)
                            fileMerges.push(...sysr.fileMerges)
                        if (sysr.outputProcessors?.length)
                            outputProcessors.push(...sysr.outputProcessors)
                        if (sysr.chatParticipants)
                            chatParticipants.push(...sysr.chatParticipants)
                        if (sysr.fileOutputs?.length)
                            fileOutputs.push(...sysr.fileOutputs)
                        if (sysr.logs?.length)
                            runTrace.details("📝 console.log", sysr.logs)
                        if (sysr.text) {
                            systemMessage.content +=
                                SYSTEM_FENCE + "\n" + sysr.text + "\n"
                            runTrace.fence(sysr.text, "markdown")
                        }
                        if (sysr.aici) {
                            runTrace.fence(sysr.aici, "yaml")
                            messages.push(sysr.aici)
                        }
                        runTrace.detailsFenced("js", system.jsSource, "js")
                        runTrace.endDetails()
                        if (sysr.status !== "success")
                            throw new Error(
                                `system ${system.id} failed ${sysr.status} ${sysr.statusText}`
                            )
                    }
                } finally {
                    trace.endDetails()
                }
            if (systemMessage.content) messages.unshift(systemMessage)

            const connection = await resolveModelConnectionInfo(genOptions, {
                trace: runTrace,
                token: true,
            })
            checkCancelled(cancellationToken)
            if (!connection.configuration)
                throw new Error(
                    "missing model connection information for " +
                        connection.info?.model
                )
            const { completer } = await resolveLanguageModel(
                connection.configuration.provider
            )
            checkCancelled(cancellationToken)
            if (!completer)
                throw new Error("model driver not found for " + connection.info)

            const modelConcurrency =
                options.modelConcurrency?.[genOptions.model] ??
                CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT
            const modelLimit = concurrentLimit(
                "model:" + genOptions.model,
                modelConcurrency
            )
            const resp = await modelLimit(() =>
                executeChatSession(
                    connection.configuration,
                    cancellationToken,
                    messages,
                    tools,
                    schemas,
                    fileOutputs,
                    outputProcessors,
                    fileMerges,
                    completer,
                    chatParticipants,
                    genOptions
                )
            )
            tracePromptResult(runTrace, resp)
            const { fileEdits } = resp
            if (fileEdits?.length && applyEdits)
                await writeFileEdits(fileEdits, { trace })
            return resp
        } catch (e) {
            runTrace.error(e)
            return {
                text: "",
                finishReason: isCancelError(e) ? "cancel" : "fail",
                error: serializeError(e),
            }
        } finally {
            runTrace.endDetails()
        }
    }

    const defFileMerge = (fn: FileMergeHandler) => {
        appendChild(node, createFileMerge(fn))
    }

    const ctx = <RunPromptContextNode>{
        ...turnCtx,
        defAgent,
        defTool,
        defSchema,
        defImages,
        defChatParticipant,
        defFileOutput,
        defOutputProcessor,
        defFileMerge,
        prompt,
        runPrompt,
    }

    return ctx
}
