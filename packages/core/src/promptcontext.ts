import {
    executeChatSession,
    mergeGenerationOptions,
    tracePromptResult,
} from "./chat"
import { host } from "./host"
import {
    HTMLEscape,
    arrayify,
    dotGenaiscriptPath,
    logVerbose,
    sha256string,
} from "./util"
import { runtimeHost } from "./host"
import { MarkdownTrace } from "./trace"
import { YAMLParse, YAMLStringify } from "./yaml"
import { createParsers } from "./parsers"
import { readText } from "./fs"
import {
    PromptNode,
    appendChild,
    createFileMergeNode,
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
import { CSVParse, CSVToMarkdown } from "./csv"
import { INIParse, INIStringify } from "./ini"
import { CancelError, isCancelError, serializeError } from "./error"
import { createFetch } from "./fetch"
import { XMLParse } from "./xml"
import { GenerationOptions } from "./generation"
import { fuzzSearch } from "./fuzzsearch"
import { parseModelIdentifier } from "./models"
import { renderAICI } from "./aici"
import { MODEL_PROVIDER_AICI } from "./constants"
import { JSONLStringify, JSONLTryParse } from "./jsonl"
import { grepSearch } from "./grep"
import { resolveFileContents, toWorkspaceFile } from "./file"
import { vectorSearch } from "./vectorsearch"
import { ChatCompletionMessageParam } from "./chattypes"
import { resolveModelConnectionInfo } from "./models"
import { resolveLanguageModel } from "./lm"

export async function createPromptContext(
    vars: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions,
    model: string
) {
    const { cancellationToken, infoCb } = options || {}
    const env = structuredClone(vars)
    const parsers = await createParsers({ trace, model })
    const YAML = Object.freeze<YAML>({
        stringify: YAMLStringify,
        parse: YAMLParse,
    })
    const CSV = Object.freeze<CSV>({
        parse: CSVParse,
        markdownify: CSVToMarkdown,
    })
    const INI = Object.freeze<INI>({
        parse: INIParse,
        stringify: INIStringify,
    })
    const XML = Object.freeze<XML>({
        parse: XMLParse,
    })
    const JSONL = Object.freeze<JSONL>({
        parse: JSONLTryParse,
        stringify: JSONLStringify,
    })
    const AICI = Object.freeze<AICI>({
        gen: (options: AICIGenOptions) => {
            // validate options
            return {
                type: "aici",
                name: "gen",
                options,
            }
        },
    })
    const path = runtimeHost.path
    const workspace: WorkspaceFileSystem = {
        readText: (f) => runtimeHost.workspace.readText(f),
        readJSON: (f) => runtimeHost.workspace.readJSON(f),
        readXML: (f) => runtimeHost.workspace.readXML(f),
        writeText: (f, c) => runtimeHost.workspace.writeText(f, c),
        findFiles: async (pattern, options) => {
            const res = await runtimeHost.workspace.findFiles(pattern, options)
            trace.files(res, {
                title: `🗃 find files <code>${HTMLEscape(pattern)}</code>`,
                maxLength: -1,
                secrets: env.secrets,
            })
            return res
        },
        grep: async (query, globs) => {
            trace.startDetails(
                `🌐 grep <code>${HTMLEscape(typeof query === "string" ? query : query.source)}</code>`
            )
            try {
                const { files } = await grepSearch(query, arrayify(globs), {
                    trace,
                })
                trace.files(files, { model, secrets: env.secrets })
                return { files }
            } finally {
                trace.endDetails()
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
            try {
                trace.startDetails(
                    `🧐 fuzz search <code>${HTMLEscape(q)}</code>`
                )
                if (!files?.length) {
                    trace.error("no files provided")
                    return []
                } else {
                    const res = await fuzzSearch(q, files, searchOptions)
                    trace.files(res, {
                        model,
                        secrets: env.secrets,
                        skipIfEmpty: true,
                    })
                    return res
                }
            } finally {
                trace.endDetails()
            }
        },
        vectorSearch: async (q, files_, searchOptions) => {
            const files = arrayify(files_).map(toWorkspaceFile)
            searchOptions = { ...(searchOptions || {}) }
            try {
                trace.startDetails(
                    `🔍 vector search <code>${HTMLEscape(q)}</code>`
                )
                if (!files?.length) {
                    trace.error("no files provided")
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
                    trace,
                })
                // search
                trace.files(res, {
                    model,
                    secrets: env.secrets,
                    skipIfEmpty: true,
                })
                return res
            } finally {
                trace.endDetails()
            }
        },
    }

    const defOutputProcessor = (fn: PromptOutputProcessorHandler) => {
        if (fn) appendPromptChild(createOutputProcessor(fn))
    }

    const promptHost: PromptHost = Object.freeze<PromptHost>({
        exec: async (command, args, options) => {
            const res = await runtimeHost.exec(undefined, command, args, {
                cwd: options?.cwd,
                trace,
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
        YAML,
        CSV,
        INI,
        AICI,
        XML,
        JSONL,
        retrieval,
        host: promptHost,
        defOutputProcessor,
        defFileMerge: (fn) => {
            appendPromptChild(createFileMergeNode(fn))
        },
        cancel: (reason?: string) => {
            throw new CancelError(reason || "user cancelled")
        },
        runPrompt: async (generator, runOptions): Promise<RunPromptResult> => {
            try {
                const { label } = runOptions || {}
                trace.startDetails(`🎁 run prompt ${label || ""}`)
                infoCb?.({ text: `run prompt ${label || ""}` })

                const genOptions = mergeGenerationOptions(options, runOptions)
                const ctx = createChatGenerationContext(genOptions, trace)
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
                        trace,
                    })

                    schemas = scs
                    tools = fns
                    chatParticipants = cps
                    messages.push(...msgs)

                    if (errors?.length)
                        throw new Error("errors while running prompt")
                }

                const connection = await resolveModelConnectionInfo(
                    genOptions,
                    { trace, token: true }
                )
                if (!connection.configuration)
                    throw new Error(
                        "model connection error " + connection.info?.model
                    )
                const { completer } = await resolveLanguageModel(
                    connection.configuration.provider
                )
                if (!completer)
                    throw new Error(
                        "model driver not found for " + connection.info
                    )
                const resp = await executeChatSession(
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
                tracePromptResult(trace, resp)
                return resp
            } catch (e) {
                trace.error(e)
                return {
                    text: "",
                    finishReason: isCancelError(e) ? "cancel" : "fail",
                    error: serializeError(e),
                }
            } finally {
                trace.endDetails()
            }
        },
        fetchText: async (urlOrFile, fetchOptions) => {
            if (typeof urlOrFile === "string") {
                urlOrFile = {
                    filename: urlOrFile,
                    content: "",
                }
            }
            const url = urlOrFile.filename
            let ok = false
            let status = 404
            let text: string
            if (/^https?:\/\//i.test(url)) {
                const fetch = await createFetch({ cancellationToken })
                const resp = await fetch(url, fetchOptions)
                ok = resp.ok
                status = resp.status
                if (ok) text = await resp.text()
            } else {
                try {
                    text = await readText("workspace://" + url)
                    ok = true
                } catch (e) {
                    logVerbose(e)
                    ok = false
                    status = 404
                }
            }
            const file: WorkspaceFile = {
                filename: urlOrFile.filename,
                content: text,
            }
            return {
                ok,
                status,
                text,
                file,
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
