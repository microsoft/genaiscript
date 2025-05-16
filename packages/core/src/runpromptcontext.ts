import debug from "debug"
const dbg = debug("genaiscript:prompt:context")
// cspell: disable
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
    createSystemNode,
    finalizeMessages,
    PromptImage,
    PromptPrediction,
    createMcpServer,
    toDefRefName,
    resolveFenceFormat,
    createFileImageNodes,
} from "./promptdom"
import { MarkdownTrace } from "./trace"
import { GenerationOptions } from "./generation"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { consoleLogFormat } from "./logging"
import { isGlobMatch } from "./glob"
import {
    arrayify,
    assert,
    ellipse,
    logError,
    logVerbose,
    logWarn,
} from "./util"
import { lastAssistantReasoning, renderShellOutput } from "./chatrender"
import { jinjaRender } from "./jinja"
import { mustacheRender } from "./mustache"
import {
    imageEncodeForLLM,
    imageTileEncodeForLLM,
    imageTransform,
    renderImageToTerminal,
} from "./image"
import { delay, uniq } from "es-toolkit"
import {
    addToolDefinitionsMessage,
    appendSystemMessage,
    CreateImageRequest,
    CreateSpeechRequest,
    executeChatSession,
    mergeGenerationOptions,
    tracePromptResult,
} from "./chat"
import { CancellationToken, checkCancelled } from "./cancellation"
import { ChatCompletionMessageParam } from "./chattypes"
import { resolveModelConnectionInfo } from "./models"
import {
    CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT,
    TOKEN_MISSING_INFO,
    TOKEN_NO_ANSWER,
    DOCS_DEF_FILES_IS_EMPTY_URL,
    TRANSCRIPTION_CACHE_NAME,
    TRANSCRIPTION_MODEL_ID,
    SPEECH_MODEL_ID,
    IMAGE_GENERATION_MODEL_ID,
    LARGE_MODEL_ID,
} from "./constants"
import { addFallbackToolSystems, resolveSystems, resolveTools } from "./systems"
import { callExpander } from "./expander"
import {
    errorMessage,
    isCancelError,
    NotSupportedError,
    serializeError,
} from "./error"
import { resolveLanguageModel } from "./lm"
import { concurrentLimit } from "./concurrency"
import { resolveScript } from "./ast"
import { dedent } from "./indent"
import { runtimeHost } from "./host"
import { writeFileEdits } from "./fileedits"
import { agentAddMemory, agentCreateCache, agentQueryMemory } from "./agent"
import { YAMLStringify } from "./yaml"
import { Project } from "./server/messages"
import { mergeEnvVarsWithSystem, parametersToVars } from "./vars"
import { FFmepgClient } from "./ffmpeg"
import { BufferToBlob } from "./bufferlike"
import { host } from "./host"
import { srtVttRender } from "./transcription"
import { hash } from "./crypto"
import { fileTypeFromBuffer } from "./filetype"
import { deleteUndefinedValues } from "./cleaners"
import { sliceData } from "./tidy"
import { toBase64 } from "@smithy/util-base64"
import { consoleColors } from "./consolecolor"
import { terminalSize } from "./terminal"
import { stderr, stdout } from "./stdio"
import { dotGenaiscriptPath } from "./workdir"
import { prettyBytes } from "./pretty"
import { createCache } from "./cache"
import { measure } from "./performance"

export function createChatTurnGenerationContext(
    options: GenerationOptions,
    trace: MarkdownTrace,
    cancellationToken: CancellationToken
): ChatTurnGenerationContext & { node: PromptNode } {
    const node: PromptNode = { children: [] }
    const fenceFormat = options.fenceFormat || resolveFenceFormat(options.model)
    const lineNumbers = options.lineNumbers

    const console = Object.freeze<PromptGenerationConsole>({
        log: (...args: any[]) => {
            const line = consoleLogFormat(...args)
            if (line) {
                trace.log(line)
                stdout.write(line + "\n")
            }
        },
        debug: (...args: any[]) => {
            const line = consoleLogFormat(...args)
            if (line) {
                trace.log(line)
                logVerbose(line)
            }
        },
        warn: (...args: any[]) => {
            const line = consoleLogFormat(...args)
            if (line) {
                trace.warn(line)
                logWarn(line)
            }
        },
        error: (...args: any[]) => {
            const line = consoleLogFormat(...args)
            if (line) {
                trace.error(line)
                logError(line)
            }
        },
    })

    const defImages = (
        files: ElementOrArray<
            string | WorkspaceFile | Buffer | Blob | ReadableStream
        >,
        defOptions?: DefImagesOptions
    ) => {
        checkCancelled(cancellationToken)
        if (files === undefined || files === null) {
            if (defOptions?.ignoreEmpty) return
            throw new Error("no images provided")
        }
        if (Array.isArray(files)) {
            if (!files.length) {
                if (defOptions?.ignoreEmpty) return
                throw new Error("no images provided")
            }
            const sliced = sliceData(files, defOptions)
            if (!defOptions?.tiled)
                sliced.forEach((file) => defImages(file, defOptions))
            else {
                appendChild(
                    node,
                    createImageNode(
                        (async () => {
                            if (!files.length) return undefined
                            const encoded = await imageTileEncodeForLLM(files, {
                                ...defOptions,
                                cancellationToken,
                                trace,
                            })
                            return encoded
                        })()
                    )
                )
            }
        } else if (
            typeof files === "string" ||
            files instanceof Blob ||
            files instanceof Buffer
        ) {
            const img = files
            appendChild(
                node,
                createImageNode(
                    (async () => {
                        const encoded = await imageEncodeForLLM(img, {
                            ...defOptions,
                            cancellationToken,
                            trace,
                        })
                        return encoded
                    })()
                )
            )
        } else {
            const file = files as WorkspaceFile
            appendChild(
                node,
                ...createFileImageNodes(undefined, file, defOptions, {
                    trace,
                    cancellationToken,
                })
            )
        }
    }

    const ctx: ChatTurnGenerationContext & { node: PromptNode } = {
        node,
        writeText: (body, options) => {
            if (body !== undefined && body !== null) {
                const { priority, maxTokens } = options || {}
                const role = options?.assistant
                    ? "assistant"
                    : options?.role || "user"
                appendChild(
                    node,
                    role === "assistant"
                        ? createAssistantNode(body, { priority, maxTokens })
                        : role === "system"
                          ? createSystemNode(body, { priority, maxTokens })
                          : createTextNode(body, { priority, maxTokens })
                )
            }
        },
        assistant: (body, options) =>
            ctx.writeText(body, {
                ...options,
                role: "assistant",
            } as WriteTextOptions),
        $: (strings, ...args) => {
            const current = createStringTemplateNode(strings, args)
            appendChild(node, current)
            const res: PromptTemplateString = Object.freeze({
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
                role: (r) => {
                    current.role = r
                    return res
                },
                cacheControl: (cc) => {
                    current.cacheControl = cc
                    return res
                },
            } satisfies PromptTemplateString)
            return res
        },
        def: (name, body, defOptions) => {
            name = name ?? ""
            const doptions = { ...(defOptions || {}), trace }
            doptions.lineNumbers = doptions.lineNumbers ?? lineNumbers
            doptions.fenceFormat = doptions.fenceFormat ?? fenceFormat

            // shortcuts
            if (body === undefined || body === null) {
                if (!doptions.ignoreEmpty)
                    throw new Error(
                        `def ${name} is ${body}. See ${DOCS_DEF_FILES_IS_EMPTY_URL}`
                    )
                return undefined
            } else if (Array.isArray(body)) {
                if (body.length === 0 && !doptions.ignoreEmpty)
                    throw new Error(
                        `def ${name} is empty. See ${DOCS_DEF_FILES_IS_EMPTY_URL}`
                    )
                body.forEach((f) => ctx.def(name, f, defOptions))
            } else if (typeof body === "string") {
                if (body.trim() === "" && !doptions.ignoreEmpty)
                    throw new Error(
                        `def ${name} is empty. See ${DOCS_DEF_FILES_IS_EMPTY_URL}`
                    )
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

                // more robust check
                if (/\.(png|jpeg|jpg|gif|webp)$/i.test(filename)) {
                    appendChild(
                        node,
                        ...createFileImageNodes(name, file, doptions, {
                            trace,
                            cancellationToken,
                        })
                    )
                } else appendChild(node, createDef(name, file, doptions))
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
            return toDefRefName(name, doptions)
        },
        defImages,
        defData: (name, data, defOptions) => {
            name = name ?? ""
            const doptions = { ...(defOptions || {}), trace }
            doptions.fenceFormat = doptions.fenceFormat ?? fenceFormat

            appendChild(node, createDefData(name, data, doptions))
            return toDefRefName(name, doptions)
        },
        defDiff: (name, left, right, defDiffOptions) => {
            name = name ?? ""
            const doptions = { ...(defDiffOptions || {}), trace }
            doptions.fenceFormat = doptions.fenceFormat ?? fenceFormat

            appendChild(node, createDefDiff(name, left, right, doptions))
            return toDefRefName(name, doptions)
        },
        fence(body, options?: DefOptions) {
            const doptions = { ...(options || {}), trace }
            doptions.fenceFormat = doptions.fenceFormat ?? fenceFormat

            ctx.def("", body, doptions)
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
    const { cancellationToken, infoCb, userState } = options || {}
    const { prj, env } = projectOptions
    assert(!!env.output, "output missing")
    const turnCtx = createChatTurnGenerationContext(
        options,
        trace,
        cancellationToken
    )
    const node = turnCtx.node

    // Default output processor for the prompt
    const defOutputProcessor = (fn: PromptOutputProcessorHandler) => {
        checkCancelled(cancellationToken)
        if (fn) appendChild(node, createOutputProcessor(fn))
    }

    const defTool: (
        name: string | ToolCallback | McpServersConfig,
        description: string | DefToolOptions,
        parameters?: PromptParametersSchema | JSONSchemaObject,
        fn?: ChatFunctionHandler,
        defOptions?: DefToolOptions
    ) => void = (name, description, parameters, fn, defOptions) => {
        checkCancelled(cancellationToken)
        if (name === undefined || name === null)
            throw new Error("tool name is missing")
        dbg(`tool %s`, name)
        if (typeof name === "string") {
            if (typeof description !== "string")
                throw new Error("tool description is missing")
            const parameterSchema =
                promptParametersSchemaToJSONSchema(parameters)
            appendChild(
                node,
                createToolNode(
                    name,
                    description,
                    parameterSchema,
                    fn,
                    defOptions,
                    ctx
                )
            )
        } else if (typeof name === "object" && (name as ToolCallback).impl) {
            const tool = name as ToolCallback
            appendChild(
                node,
                createToolNode(
                    tool.spec.name,
                    tool.spec.description,
                    tool.spec.parameters as any,
                    tool.impl,
                    defOptions,
                    ctx
                )
            )
        } else if (typeof name === "object") {
            dbg(`mcp %O`, name)
            for (const kv of Object.entries(name)) {
                const [id, def] = kv
                if ((def as McpServerConfig).command) {
                    const serverConfig = def as McpServerConfig
                    appendChild(
                        node,
                        createMcpServer(id, serverConfig, defOptions, ctx)
                    )
                }
            }
        }
    }

    const adbgm = debug(`agent:memory`)
    const defAgent = (
        name: string,
        description: string,
        fn: (
            agentCtx: ChatGenerationContext,
            args: ChatFunctionArgs
        ) => Promise<void>,
        options?: DefAgentOptions
    ): void => {
        checkCancelled(cancellationToken)
        const {
            variant,
            tools,
            system,
            disableMemory,
            disableMemoryQuery,
            ...rest
        } = options || {}
        const memory = disableMemory
            ? undefined
            : agentCreateCache({ userState })

        name = name.replace(/^agent_/i, "")
        const adbg = debug(`agent:${name}`)
        adbg(`created ${variant || ""}`)
        const agentName = `agent_${name}${variant ? "_" + variant : ""}`
        const agentLabel = `agent ${name}${variant ? " " + variant : ""}`

        const agentSystem = uniq([
            "system.assistant",
            "system.tools",
            "system.explanations",
            "system.safety_jailbreak",
            "system.safety_harmful_content",
            "system.safety_protected_material",
            ...arrayify(system),
        ])
        const agentTools = resolveTools(
            runtimeHost.project,
            agentSystem,
            arrayify(tools)
        )
        const agentDescription = ellipse(
            `Agent that uses an LLM to ${description}.\nAvailable tools:${agentTools.map((t) => `- ${t.description}`).join("\n")}`,
            1020
        ) // DO NOT LEAK TOOL ID HERE
        dbg(`description: ${agentDescription}`)

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
                // the LLM automatically adds extract arguments to the context
                checkCancelled(cancellationToken)
                const { context, ...argsRest } = args
                const { query, ...argsNoQuery } = argsRest

                infoCb?.({
                    text: `${agentLabel}: ${query} ${parametersToVars(argsNoQuery)}`,
                })
                adbg(`query: ${query}`)

                const hasExtraArgs = Object.keys(argsNoQuery).length > 0
                if (hasExtraArgs) adbg(`extra args: %O`, argsNoQuery)

                let memoryAnswer: string
                if (memory && query && !disableMemoryQuery) {
                    memoryAnswer = await agentQueryMemory(
                        memory,
                        ctx,
                        query +
                            (hasExtraArgs
                                ? `\n${YAMLStringify(argsNoQuery)}`
                                : ""),
                        { trace }
                    )
                    if (memoryAnswer) adbgm(`found ${memoryAnswer}`)
                }

                const res = await ctx.runPrompt(
                    async (_) => {
                        if (typeof fn === "string")
                            _.writeText(dedent(fn), { role: "system" })
                        else await fn(_, args)
                        _.$`Make a plan and solve the task described in <QUERY>.
                        
                        - Assume that your answer will be analyzed by an LLM, not a human.
                        - If you are missing information, reply "${TOKEN_MISSING_INFO}: <what is missing>".
                        - If you cannot answer the query, return "${TOKEN_NO_ANSWER}: <reason>".
                        - Be concise. Minimize output to the most relevant information to save context tokens.
                        `.role("system")
                        if (memoryAnswer)
                            _.$`- The <QUERY> applied to the agent memory is in <MEMORY>.`.role(
                                "system"
                            )
                        _.def("QUERY", query)
                        if (Object.keys(argsNoQuery).length)
                            _.defData("QUERY_CONTEXT", argsNoQuery, {
                                format: "yaml",
                            })

                        if (memoryAnswer) _.def("MEMORY", memoryAnswer)
                        if (memory)
                            _.defOutputProcessor(async ({ text }) => {
                                if (
                                    text &&
                                    !(
                                        text.startsWith(TOKEN_MISSING_INFO) ||
                                        text.startsWith(TOKEN_NO_ANSWER)
                                    )
                                ) {
                                    adbgm(`add ${text}`)
                                    await agentAddMemory(
                                        memory,
                                        agentName,
                                        query,
                                        text,
                                        {
                                            trace,
                                        }
                                    )
                                }
                            })
                    },
                    {
                        model: "agent",
                        label: agentLabel,
                        system: agentSystem,
                        tools: agentTools.map(({ id }) => id),
                        ...rest,
                    }
                )
                if (res.error) {
                    adbg(`error: ${res.error}`)
                    throw res.error
                }
                const response = res.text
                adbgm(`response: %O`, response)
                return response
            }
        )
    }

    const defSchema = (
        name: string,
        schema: JSONSchema,
        defOptions?: DefSchemaOptions
    ) => {
        checkCancelled(cancellationToken)
        appendChild(node, createSchemaNode(name, schema, defOptions))

        return name
    }

    const defChatParticipant = (
        generator: ChatParticipantHandler,
        options?: ChatParticipantOptions
    ) => {
        checkCancelled(cancellationToken)
        if (generator)
            appendChild(node, createChatParticipant({ generator, options }))
    }

    const defFileOutput = (
        pattern: ElementOrArray<string | WorkspaceFile>,
        description: string,
        options?: FileOutputOptions
    ): void => {
        checkCancelled(cancellationToken)
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
        checkCancelled(cancellationToken)
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

    const transcribe = async (
        audio: string | WorkspaceFile,
        options?: TranscriptionOptions
    ): Promise<TranscriptionResult> => {
        checkCancelled(cancellationToken)
        const { cache, ...rest } = options || {}
        const transcriptionTrace = trace.startTraceDetails("🎤 transcribe")
        try {
            const conn: ModelConnectionOptions = {
                model: options?.model,
            }
            const { info, configuration } = await resolveModelConnectionInfo(
                conn,
                {
                    trace: transcriptionTrace,
                    defaultModel: TRANSCRIPTION_MODEL_ID,
                    cancellationToken,
                    token: true,
                }
            )
            if (info.error) throw new Error(info.error)
            if (!configuration) throw new Error("model configuration not found")
            checkCancelled(cancellationToken)
            const { ok } = await runtimeHost.pullModel(configuration, {
                trace: transcriptionTrace,
                cancellationToken,
            })
            if (!ok) throw new Error(`failed to pull model ${conn}`)
            checkCancelled(cancellationToken)
            const { transcriber } = await resolveLanguageModel(
                configuration.provider
            )
            if (!transcriber)
                throw new Error("audio transcribe not found for " + info.model)
            const ffmpeg = new FFmepgClient()
            const audioFile = await ffmpeg.extractAudio(audio, {
                transcription: true,
                cache,
            })
            const file = await BufferToBlob(
                await host.readFile(audioFile),
                "audio/ogg"
            )
            const update: () => Promise<TranscriptionResult> = async () => {
                transcriptionTrace.itemValue(`model`, configuration.model)
                transcriptionTrace.itemValue(
                    `file size`,
                    prettyBytes(file.size)
                )
                transcriptionTrace.itemValue(`file type`, file.type)
                const res = await transcriber(
                    {
                        file,
                        model: configuration.model,
                        language: options?.language,
                        translate: options?.translate,
                    },
                    configuration,
                    {
                        trace: transcriptionTrace,
                        cancellationToken,
                    }
                )
                srtVttRender(res)
                return res
            }

            let res: TranscriptionResult
            const _cache = createCache<
                { file: Blob } & TranscriptionOptions,
                TranscriptionResult
            >(
                cache === true
                    ? TRANSCRIPTION_CACHE_NAME
                    : typeof cache === "string"
                      ? cache
                      : undefined,
                { type: "fs" }
            )
            if (cache) {
                const hit = await _cache.getOrUpdate(
                    { file, ...rest },
                    update,
                    (res) => !res.error
                )
                transcriptionTrace.itemValue(
                    `cache ${hit.cached ? "hit" : "miss"}`,
                    hit.key
                )
                res = hit.value
            } else res = await update()
            transcriptionTrace.fence(res.text, "markdown")
            if (res.error) transcriptionTrace.error(errorMessage(res.error))
            if (res.segments) transcriptionTrace.fence(res.segments, "yaml")
            return res
        } catch (e) {
            logError(e)
            transcriptionTrace.error(e)
            return {
                text: undefined,
                error: serializeError(e),
            } satisfies TranscriptionResult
        } finally {
            transcriptionTrace.endDetails()
        }
    }

    const speak = async (
        input: string,
        options?: SpeechOptions
    ): Promise<SpeechResult> => {
        checkCancelled(cancellationToken)
        const { cache, voice, instructions, ...rest } = options || {}
        const speechTrace = trace.startTraceDetails("🦜 speak")
        try {
            const conn: ModelConnectionOptions = {
                model: options?.model || SPEECH_MODEL_ID,
            }
            const { info, configuration } = await resolveModelConnectionInfo(
                conn,
                {
                    trace: speechTrace,
                    defaultModel: SPEECH_MODEL_ID,
                    cancellationToken,
                    token: true,
                }
            )
            if (info.error) throw new Error(info.error)
            if (!configuration) throw new Error("model configuration not found")
            checkCancelled(cancellationToken)
            const { ok } = await runtimeHost.pullModel(configuration, {
                trace: speechTrace,
                cancellationToken,
            })
            if (!ok) throw new Error(`failed to pull model ${conn}`)
            checkCancelled(cancellationToken)
            const { speaker } = await resolveLanguageModel(
                configuration.provider
            )
            if (!speaker)
                throw new Error("speech converter not found for " + info.model)
            speechTrace.itemValue(`model`, configuration.model)
            const req = deleteUndefinedValues({
                input,
                model: configuration.model,
                voice,
                instructions: dedent(instructions),
            }) satisfies CreateSpeechRequest
            const res = await speaker(req, configuration, {
                trace: speechTrace,
                cancellationToken,
            })
            if (res.error) {
                speechTrace.error(errorMessage(res.error))
                return { error: res.error } satisfies SpeechResult
            }
            const h = await hash(res.audio, { length: 20 })
            const { ext } = (await fileTypeFromBuffer(res.audio)) || {}
            const filename = dotGenaiscriptPath("speech", h + "." + ext)
            await host.writeFile(filename, res.audio)
            return {
                filename,
            } satisfies SpeechResult
        } catch (e) {
            logError(e)
            speechTrace.error(e)
            return {
                filename: undefined,
                error: serializeError(e),
            } satisfies SpeechResult
        } finally {
            speechTrace.endDetails()
        }
    }

    const defFileMerge = (fn: FileMergeHandler) => {
        checkCancelled(cancellationToken)
        appendChild(node, createFileMerge(fn))
    }

    const runPrompt = async (
        generator: string | PromptGenerator,
        runOptions?: PromptGeneratorOptions
    ): Promise<RunPromptResult> => {
        checkCancelled(cancellationToken)
        Object.freeze(runOptions)
        const { label, applyEdits, throwOnError } = runOptions || {}
        const runTrace = trace.startTraceDetails(`🎁 ${label || "prompt"}`)
        let messages: ChatCompletionMessageParam[] = []
        try {
            infoCb?.({ text: label || "prompt" })

            const genOptions = mergeGenerationOptions(options, runOptions)
            genOptions.inner = true
            genOptions.trace = runTrace
            const { info, configuration } = await resolveModelConnectionInfo(
                genOptions,
                {
                    trace: runTrace,
                    defaultModel: LARGE_MODEL_ID,
                    cancellationToken,
                    token: true,
                }
            )
            if (info.error) throw new Error(info.error)
            if (!configuration) throw new Error("model configuration not found")
            genOptions.model = info.model
            genOptions.stats = genOptions.stats.createChild(
                genOptions.model,
                label
            )
            const { ok } = await runtimeHost.pullModel(configuration, {
                trace: runTrace,
                cancellationToken,
            })
            if (!ok) throw new Error(`failed to pull model ${genOptions.model}`)

            const runCtx = createChatGenerationContext(
                genOptions,
                runTrace,
                projectOptions
            )
            if (typeof generator === "string")
                runCtx.node.children.push(createTextNode(generator))
            else await generator(runCtx)
            const node = runCtx.node

            checkCancelled(cancellationToken)

            let tools: ToolCallback[] = undefined
            let schemas: Record<string, JSONSchema> = undefined
            let chatParticipants: ChatParticipant[] = undefined
            const images: PromptImage[] = []
            const fileMerges: FileMergeHandler[] = []
            const outputProcessors: PromptOutputProcessorHandler[] = []
            const fileOutputs: FileOutput[] = []
            const disposables: AsyncDisposable[] = []
            let prediction: PromptPrediction

            // expand template
            const {
                errors,
                schemas: scs,
                tools: fns,
                messages: msgs,
                chatParticipants: cps,
                fileMerges: fms,
                outputProcessors: ops,
                fileOutputs: fos,
                images: imgs,
                prediction: pred,
                disposables: dps,
            } = await renderPromptNode(genOptions.model, node, {
                flexTokens: genOptions.flexTokens,
                fenceFormat: genOptions.fenceFormat,
                trace: runTrace,
                cancellationToken,
            })

            schemas = scs
            tools = fns
            chatParticipants = cps
            messages.push(...msgs)
            fileMerges.push(...fms)
            outputProcessors.push(...ops)
            fileOutputs.push(...fos)
            images.push(...imgs)
            disposables.push(...dps)
            prediction = pred

            if (errors?.length) {
                logError(errors.map((err) => errorMessage(err)).join("\n"))
                throw new Error("errors while running prompt")
            }

            const systemScripts = resolveSystems(prj, runOptions ?? {}, tools)
            if (
                addFallbackToolSystems(
                    systemScripts,
                    tools,
                    runOptions,
                    genOptions
                )
            ) {
                assert(!Object.isFrozen(genOptions))
                genOptions.fallbackTools = true
                dbg(`fallback tools added ${genOptions.fallbackTools}`)
            }

            if (systemScripts.length)
                try {
                    runTrace.startDetails("👾 systems")
                    for (const systemId of systemScripts) {
                        checkCancelled(cancellationToken)
                        dbg(`system ${systemId.id}`, {
                            fallbackTools: genOptions.fallbackTools,
                        })
                        const system = resolveScript(prj, systemId)
                        if (!system)
                            throw new Error(
                                `system template ${systemId.id} not found`
                            )
                        runTrace.startDetails(`👾 ${system.id}`)
                        if (systemId.parameters)
                            runTrace.detailsFenced(
                                `parameters`,
                                YAMLStringify(systemId.parameters)
                            )
                        const sysr = await callExpander(
                            prj,
                            system,
                            mergeEnvVarsWithSystem(env, systemId),
                            runTrace,
                            genOptions,
                            false
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
                        if (sysr.disposables?.length)
                            disposables.push(...sysr.disposables)
                        if (sysr.logs?.length)
                            runTrace.details("📝 console.log", sysr.logs)
                        for (const smsg of sysr.messages) {
                            if (
                                smsg.role === "user" &&
                                typeof smsg.content === "string"
                            ) {
                                appendSystemMessage(messages, smsg.content)
                                runTrace.fence(smsg.content, "markdown")
                            } else
                                throw new NotSupportedError(
                                    "only string user messages supported in system"
                                )
                        }
                        genOptions.logprobs =
                            genOptions.logprobs || system.logprobs
                        runTrace.detailsFenced(
                            "💻 script source",
                            system.jsSource,
                            "js"
                        )
                        runTrace.endDetails()
                        if (sysr.status !== "success")
                            throw new Error(
                                `system ${system.id} failed ${sysr.status} ${sysr.statusText}`
                            )
                    }
                } finally {
                    runTrace.endDetails()
                }

            if (genOptions.fallbackTools) {
                dbg(`fallback tools definitions added`)
                addToolDefinitionsMessage(messages, tools)
            }

            finalizeMessages(genOptions.model, messages, {
                ...genOptions,
                fileOutputs,
                trace: runTrace,
            })
            const { completer } = await resolveLanguageModel(
                configuration.provider
            )
            if (!completer)
                throw new Error("model driver not found for " + info.model)
            checkCancelled(cancellationToken)

            const modelConcurrency =
                options.modelConcurrency?.[genOptions.model] ??
                CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT
            const modelLimit = concurrentLimit(
                "model:" + genOptions.model,
                modelConcurrency
            )
            dbg(`run ${genOptions.model}`)
            const resp = await modelLimit(() =>
                executeChatSession(
                    configuration,
                    cancellationToken,
                    messages,
                    tools,
                    schemas,
                    fileOutputs,
                    outputProcessors,
                    fileMerges,
                    prediction,
                    completer,
                    chatParticipants,
                    disposables,
                    genOptions
                )
            )
            tracePromptResult(runTrace, resp)
            await writeFileEdits(resp.fileEdits, {
                applyEdits,
                trace: runTrace,
            })
            if (resp.error && throwOnError)
                throw new Error(errorMessage(resp.error))
            return resp
        } catch (e) {
            runTrace.error(e)
            if (throwOnError) throw e
            return {
                messages,
                text: "",
                reasoning: lastAssistantReasoning(messages),
                finishReason: isCancelError(e) ? "cancel" : "fail",
                error: serializeError(e),
            }
        } finally {
            runTrace.endDetails()
        }
    }

    const generateImage = async (
        prompt: string,
        imageOptions?: ImageGenerationOptions
    ): Promise<{ image: WorkspaceFile; revisedPrompt?: string }> => {
        if (!prompt) throw new Error("prompt is missing")

        const imgTrace = trace.startTraceDetails("🖼️ generate image")
        try {
            const { style, quality, size, outputFormat, mime, ...rest } =
                imageOptions || {}
            const conn: ModelConnectionOptions = {
                model: imageOptions?.model || IMAGE_GENERATION_MODEL_ID,
            }
            const { info, configuration } = await resolveModelConnectionInfo(
                conn,
                {
                    trace: imgTrace,
                    defaultModel: IMAGE_GENERATION_MODEL_ID,
                    cancellationToken,
                    token: true,
                }
            )
            if (info.error) throw new Error(info.error)
            if (!configuration)
                throw new Error(
                    `model configuration not found for ${conn.model}`
                )
            const stats = options.stats.createChild(
                info.model,
                "generate image"
            )
            checkCancelled(cancellationToken)
            const { ok } = await runtimeHost.pullModel(configuration, {
                trace: imgTrace,
                cancellationToken,
            })
            if (!ok) throw new Error(`failed to pull model '${conn}'`)
            checkCancelled(cancellationToken)
            const { imageGenerator } = await resolveLanguageModel(
                configuration.provider
            )
            if (!imageGenerator)
                throw new Error("image generator not found for " + info.model)
            imgTrace.itemValue(`model`, configuration.model)
            const req = deleteUndefinedValues({
                model: configuration.model,
                prompt: dedent(prompt),
                size,
                quality,
                style,
                outputFormat,
            }) satisfies CreateImageRequest
            const m = measure("img.generate", `${req.model} -> image`)
            const res = await imageGenerator(req, configuration, {
                trace: imgTrace,
                cancellationToken,
                ...rest,
            })
            const duration = m()
            if (res.error) {
                imgTrace.error(errorMessage(res.error))
                return undefined
            }
            dbg(`usage: %o`, res.usage)
            stats.addImageGenerationUsage(res.usage, duration)

            const h = await hash(res.image, { length: 20 })
            const buf = await imageTransform(res.image, {
                ...(imageOptions || {}),
                mime:
                    mime ??
                    (outputFormat === "jpeg" || outputFormat === "webp"
                        ? `image/jpeg`
                        : outputFormat === "png"
                          ? `image/png`
                          : undefined),
                cancellationToken,
                trace: imgTrace,
            })
            const { ext } = (await fileTypeFromBuffer(buf)) || {}
            const filename = dotGenaiscriptPath("image", h + "." + ext)
            await host.writeFile(filename, buf)

            if (consoleColors) {
                const size = terminalSize()
                stderr.write(
                    await renderImageToTerminal(buf, {
                        ...size,
                        label: filename,
                        usage: res.usage,
                        modelId: info.model,
                    })
                )
            } else logVerbose(`image: ${filename}`)

            imgTrace.image(filename, `generated image`)
            imgTrace.detailsFenced(`🔀 revised prompt`, res.revisedPrompt)
            return {
                image: {
                    filename,
                    encoding: "base64",
                    content: toBase64(res.image),
                } satisfies WorkspaceFile,
                revisedPrompt: res.revisedPrompt,
            }
        } finally {
            imgTrace.endDetails()
        }
    }

    const ctx: RunPromptContextNode = Object.freeze<RunPromptContextNode>({
        ...turnCtx,
        defAgent,
        defTool,
        defSchema,
        defChatParticipant,
        defFileOutput,
        defOutputProcessor,
        defFileMerge,
        prompt,
        runPrompt,
        transcribe,
        speak,
        generateImage,
        env,
    })

    return ctx
}
