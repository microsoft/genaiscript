import { ChatCompletionsOptions, LanguageModel } from "./chat"
import { HTMLEscape, arrayify, logVerbose } from "./util"
import { host } from "./host"
import { MarkdownTrace } from "./trace"
import { YAMLParse, YAMLStringify } from "./yaml"
import { createParsers } from "./parsers"
import { upsertVector, vectorSearch } from "./retrieval"
import { readText } from "./fs"
import {
    PromptNode,
    appendChild,
    createChatParticipant,
    createFileMergeNode,
    createImageNode,
    createOutputProcessor,
} from "./promptdom"
import { bingSearch } from "./websearch"
import { CancellationToken } from "./cancellation"
import {
    RunPromptContextNode,
    createRunPromptContext,
} from "./runpromptcontext"
import { CSVParse, CSVToMarkdown } from "./csv"
import { INIParse, INIStringify } from "./ini"
import { CancelError } from "./error"
import { createFetch } from "./fetch"
import { resolveFileDataUri } from "./file"
import { XMLParse } from "./xml"
import { GenerationStats } from "./expander"
import { fuzzSearch } from "./fuzzsearch"

function stringLikeToFileName(f: string | WorkspaceFile) {
    return typeof f === "string" ? f : f?.filename
}

export function createPromptContext(
    vars: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions,
    model: string
) {
    const env = new Proxy(vars, {
        get: (target: any, prop, recv) => {
            const v = target[prop]
            if (v === undefined) {
                trace.error(`\`env.${String(prop)}\` not defined`)
                return ""
            }
            return v
        },
    })
    const parsers = createParsers({ trace, model })
    const YAML = Object.freeze<YAML>({
        stringify: YAMLStringify,
        parse: YAMLParse,
    })
    const CSV = Object.freeze<CSV>({
        parse: CSVParse,
        mardownify: CSVToMarkdown,
    })
    const INI = Object.freeze<INI>({
        parse: INIParse,
        stringify: INIStringify,
    })
    const XML = Object.freeze<XML>({
        parse: XMLParse,
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
    const path = host.path
    const workspace: WorkspaceFileSystem = {
        readText: (f) => host.workspace.readText(f),
        writeText: (f, c) => host.workspace.writeText(f, c),
        findFiles: async (pattern, options) => {
            const res = await host.workspace.findFiles(pattern, options)
            trace.files(res, {
                title: `🗃 find files <code>${HTMLEscape(pattern)}</code>`,
                maxLength: -1,
                secrets: env.secrets,
            })
            return res
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
            const files = arrayify(files_)
            searchOptions = searchOptions || {}
            try {
                trace.startDetails(
                    `🔍 vector search <code>${HTMLEscape(q)}</code>`
                )
                if (!files?.length) {
                    trace.error("no files provided")
                    return []
                } else {
                    await upsertVector(files, { trace, ...searchOptions })
                    const vres = await vectorSearch(q, {
                        ...searchOptions,
                        files: files.map(stringLikeToFileName),
                    })
                    const res: WorkspaceFileWithScore[] =
                        searchOptions?.outputType === "chunk"
                            ? vres.chunks
                            : vres.files
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
    }

    const defImages = (files: StringLike, defOptions?: DefImagesOptions) => {
        const { detail } = defOptions || {}
        if (Array.isArray(files))
            files.forEach((file) => defImages(file, defOptions))
        else if (typeof files === "string")
            appendPromptChild(createImageNode({ url: files, detail }))
        else {
            const file: WorkspaceFile = files
            appendPromptChild(
                createImageNode(
                    (async () => {
                        const url = await resolveFileDataUri(file, { trace })
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

    const defOutputProcessor = (fn: PromptOutputProcessorHandler) => {
        if (fn) appendPromptChild(createOutputProcessor(fn))
    }

    const defChatParticipant = (participant: ChatParticipantHandler) => {
        if (participant) appendPromptChild(createChatParticipant(participant))
    }

    const promptHost: PromptHost = {
        askUser: (question) =>
            host.askUser({
                prompt: question,
            }),
        exec: async (command, args, options) => {
            const res = await host.exec(undefined, command, args, {
                cwd: options?.cwd,
                trace,
            })
            return res
        },
        container: async (options) => {
            const res = await host.container({ ...(options || {}), trace })
            return res
        },
    }

    const ctx = Object.freeze<PromptContext & RunPromptContextNode>({
        ...createRunPromptContext(options, env, trace),
        script: () => {},
        system: () => {},
        env,
        path,
        fs: workspace,
        workspace,
        parsers,
        YAML,
        CSV,
        INI,
        AICI,
        XML,
        retrieval,
        host: promptHost,
        defImages,
        defOutputProcessor,
        defChatParticipant,
        defFileMerge: (fn) => {
            appendPromptChild(createFileMergeNode(fn))
        },
        cancel: (reason?: string) => {
            throw new CancelError(reason || "user cancelled")
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
                const fetch = await createFetch()
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
    })
    const appendPromptChild = (node: PromptNode) => {
        if (!ctx.node) throw new Error("Prompt closed")
        appendChild(ctx.node, node)
    }

    return ctx
}

export interface GenerationOptions
    extends ChatCompletionsOptions,
        ModelOptions,
        ScriptRuntimeOptions {
    cancellationToken?: CancellationToken
    infoCb?: (partialResponse: {
        text: string
        label?: string
        vars?: Partial<ExpansionVariables>
    }) => void
    trace: MarkdownTrace
    maxCachedTemperature?: number
    maxCachedTopP?: number
    skipLLM?: boolean
    label?: string
    cliInfo?: {
        spec: string
    }
    languageModel?: LanguageModel
    vars?: PromptParameters
    stats: GenerationStats
}
