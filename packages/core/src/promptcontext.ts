import {
    executeChatSession,
    mergeGenerationOptions,
    tracePromptResult,
} from "./chat"
import { host } from "./host"
import { HTMLEscape, arrayify, dotGenaiscriptPath, sha256string } from "./util"
import { runtimeHost } from "./host"
import { MarkdownTrace } from "./trace"
import { createParsers } from "./parsers"
import {
    PromptNode,
    appendChild,
    createFileMerge,
    createOutputProcessor,
    createTextNode,
    renderPromptNode,
} from "./promptdom"
import { bingSearch } from "./websearch"
import { checkCancelled } from "./cancellation"
import {
    RunPromptContextNode,
    createChatGenerationContext,
} from "./runpromptcontext"
import { isCancelError, NotSupportedError, serializeError } from "./error"
import { GenerationOptions } from "./generation"
import { fuzzSearch } from "./fuzzsearch"
import { parseModelIdentifier } from "./models"
import { renderAICI } from "./aici"
import {
    MODEL_PROVIDER_AICI,
    CHAT_REQUEST_PER_MODEL_CONCURRENT_LIMIT,
    SYSTEM_FENCE,
} from "./constants"
import { grepSearch } from "./grep"
import { resolveFileContents, toWorkspaceFile } from "./file"
import { vectorSearch } from "./vectorsearch"
import {
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
} from "./chattypes"
import { resolveModelConnectionInfo } from "./models"
import { resolveLanguageModel } from "./lm"
import { callExpander } from "./expander"
import { Project } from "./ast"
import { resolveSystems } from "./systems"
import { shellParse } from "./shell"
import { sleep } from "openai/core.mjs"
import { concurrentLimit, PLimitPromiseQueue } from "./concurrency"

export async function createPromptContext(
    prj: Project,
    vars: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions,
    model: string
) {
    const { cancellationToken, infoCb } = options || {}
    const { generator, ...varsNoGenerator } = vars
    const env = { generator, ...structuredClone(varsNoGenerator) }
    const parsers = await createParsers({ trace, model })
    const path = runtimeHost.path
    const workspace: WorkspaceFileSystem = {
        readText: (f) => runtimeHost.workspace.readText(f),
        readJSON: (f) => runtimeHost.workspace.readJSON(f),
        readXML: (f) => runtimeHost.workspace.readXML(f),
        writeText: (f, c) => runtimeHost.workspace.writeText(f, c),
        cache: (n) => runtimeHost.workspace.cache(n),
        findFiles: async (pattern, options) => {
            const res = await runtimeHost.workspace.findFiles(pattern, options)
            trace.files(res, {
                title: `🗃 find files <code>${HTMLEscape(pattern)}</code>`,
                maxLength: -1,
                secrets: env.secrets,
            })
            return res
        },
        grep: async (query, globs, options) => {
            const grepTrace = trace.startTraceDetails(
                `🌐 grep <code>${HTMLEscape(typeof query === "string" ? query : query.source)}</code>`
            )
            try {
                const { files } = await grepSearch(query, arrayify(globs), {
                    trace: grepTrace,
                    ...options,
                })
                grepTrace.files(files, { model, secrets: env.secrets })
                return { files }
            } finally {
                grepTrace.endDetails()
            }
        },
    }

    const retrieval: Retrieval = {
        webSearch: async (q) => {
            try {
                trace.startDetails(
                    `🌐 web search <code>${HTMLEscape(q)}</code>`
                )
                const { webPages } = (await bingSearch(q, { trace })) || {}
                const files = webPages?.value?.map(
                    ({ url, snippet }) =>
                        <WorkspaceFile>{
                            filename: url,
                            content: snippet,
                        }
                )
                trace.files(files, { model, secrets: env.secrets })
                return files
            } finally {
                trace.endDetails()
            }
        },
        fuzzSearch: async (q, files_, searchOptions) => {
            const files = arrayify(files_)
            searchOptions = searchOptions || {}
            const fuzzTrace = trace.startTraceDetails(
                `🧐 fuzz search <code>${HTMLEscape(q)}</code>`
            )
            try {
                if (!files?.length) {
                    fuzzTrace.error("no files provided")
                    return []
                } else {
                    const res = await fuzzSearch(q, files, {
                        ...searchOptions,
                        trace: fuzzTrace,
                    })
                    fuzzTrace.files(res, {
                        model,
                        secrets: env.secrets,
                        skipIfEmpty: true,
                    })
                    return res
                }
            } finally {
                fuzzTrace.endDetails()
            }
        },
        vectorSearch: async (q, files_, searchOptions) => {
            const files = arrayify(files_).map(toWorkspaceFile)
            searchOptions = { ...(searchOptions || {}) }
            const vecTrace = trace.startTraceDetails(
                `🔍 vector search <code>${HTMLEscape(q)}</code>`
            )
            try {
                if (!files?.length) {
                    vecTrace.error("no files provided")
                    return []
                }

                await resolveFileContents(files)
                searchOptions.embeddingsModel =
                    searchOptions?.embeddingsModel ??
                    options?.embeddingsModel ??
                    host.defaultEmbeddingsModelOptions.embeddingsModel
                const key = await sha256string(
                    JSON.stringify({ files, searchOptions })
                )
                const folderPath = dotGenaiscriptPath("vectors", key)
                const res = await vectorSearch(q, files, {
                    ...searchOptions,
                    folderPath,
                    trace: vecTrace,
                })
                // search
                vecTrace.files(res, {
                    model,
                    secrets: env.secrets,
                    skipIfEmpty: true,
                })
                return res
            } finally {
                vecTrace.endDetails()
            }
        },
    }

    const defOutputProcessor = (fn: PromptOutputProcessorHandler) => {
        if (fn) appendPromptChild(createOutputProcessor(fn))
    }

    const promptHost: PromptHost = Object.freeze<PromptHost>({
        exec: async (
            command: string,
            args?: string[] | ShellOptions,
            options?: ShellOptions
        ) => {
            if (!Array.isArray(args) && typeof args === "object") {
                // exec("cmd arg arg", {...})
                if (options !== undefined)
                    throw new Error("Options must be the second argument")
                options = args as ShellOptions
                const parsed = shellParse(command)
                command = parsed[0]
                args = parsed.slice(1)
            } else if (args === undefined) {
                // exec("cmd arg arg")
                const parsed = shellParse(command)
                command = parsed[0]
                args = parsed.slice(1)
            }
            const res = await runtimeHost.exec(undefined, command, args, {
                cwd: options?.cwd,
                trace,
            })
            return res
        },
        browse: async (url, options) => {
            const res = await runtimeHost.browse(url, {
                trace,
                ...(options || {}),
            })
            return res
        },
        container: async (options) => {
            const res = await runtimeHost.container({
                ...(options || {}),
                trace,
            })
            return res
        },
        select: async (message, options) =>
            await runtimeHost.select(message, options),
        input: async (message) => await runtimeHost.input(message),
        confirm: async (message) => await runtimeHost.confirm(message),
        pQueue: (options) => new PLimitPromiseQueue(options),
    })

    const ctx: PromptContext & RunPromptContextNode = {
        ...createChatGenerationContext(options, trace),
        script: () => {},
        system: () => {},
        env: undefined, // set later
        path,
        fs: workspace,
        workspace,
        parsers,
        retrieval,
        host: promptHost,
        defOutputProcessor,
        defFileMerge: (fn) => {
            appendPromptChild(createFileMerge(fn))
        },
        prompt: (template, ...args): RunPromptResultPromiseWithOptions => {
            const options: PromptGeneratorOptions = {}
            const p: RunPromptResultPromiseWithOptions =
                new Promise<RunPromptResult>(async (resolve, reject) => {
                    try {
                        await sleep(0)
                        // data race for options
                        const res = await ctx.runPrompt(async (_) => {
                            _.$(template, ...args)
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
        },
        runPrompt: async (generator, runOptions): Promise<RunPromptResult> => {
            const { label } = runOptions || {}
            const runTrace = trace.startTraceDetails(
                `🎁 run prompt ${label || ""}`
            )
            try {
                infoCb?.({ text: `run prompt ${label || ""}` })

                const genOptions = mergeGenerationOptions(options, runOptions)
                genOptions.inner = true
                genOptions.trace = runTrace
                const ctx = createChatGenerationContext(genOptions, runTrace)
                if (typeof generator === "string")
                    ctx.node.children.push(createTextNode(generator))
                else await generator(ctx)
                const node = ctx.node

                checkCancelled(cancellationToken)

                let messages: ChatCompletionMessageParam[] = []
                let tools: ToolCallback[] = undefined
                let schemas: Record<string, JSONSchema> = undefined
                let chatParticipants: ChatParticipant[] = undefined

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
                    } = await renderPromptNode(genOptions.model, node, {
                        flexTokens: genOptions.flexTokens,
                        trace: runTrace,
                    })

                    schemas = scs
                    tools = fns
                    chatParticipants = cps
                    messages.push(...msgs)

                    if (errors?.length)
                        throw new Error("errors while running prompt")
                }

                const systemMessage: ChatCompletionSystemMessageParam = {
                    role: "system",
                    content: "",
                }
                for (const systemId of resolveSystems(prj, runOptions ?? {})) {
                    checkCancelled(cancellationToken)

                    const system = prj.getTemplate(systemId)
                    if (!system)
                        throw new Error(`system template ${systemId} not found`)
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
                        throw new NotSupportedError("fileMerges")
                    if (sysr.outputProcessors?.length)
                        throw new NotSupportedError("outputProcessors")
                    if (sysr.chatParticipants)
                        chatParticipants.push(...sysr.chatParticipants)
                    if (sysr.fileOutputs?.length)
                        throw new NotSupportedError("fileOutputs")
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
                if (systemMessage.content) messages.unshift(systemMessage)

                const connection = await resolveModelConnectionInfo(
                    genOptions,
                    { trace: runTrace, token: true }
                )
                checkCancelled(cancellationToken)
                if (!connection.configuration)
                    throw new Error(
                        "model connection error " + connection.info?.model
                    )
                const { completer } = await resolveLanguageModel(
                    connection.configuration.provider
                )
                checkCancelled(cancellationToken)
                if (!completer)
                    throw new Error(
                        "model driver not found for " + connection.info
                    )

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
                        vars,
                        tools,
                        schemas,
                        completer,
                        chatParticipants,
                        genOptions
                    )
                )
                tracePromptResult(runTrace, resp)
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
        },
    }
    env.generator = ctx
    ctx.env = Object.freeze(env)
    const appendPromptChild = (node: PromptNode) => {
        if (!ctx.node) throw new Error("Prompt closed")
        appendChild(ctx.node, node)
    }

    return ctx
}
