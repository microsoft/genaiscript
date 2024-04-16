import { ChatCompletionsOptions, LanguageModel } from "./chat"
import { logVerbose, toBase64 } from "./util"
import { fileTypeFromBuffer } from "file-type"
import { host } from "./host"
import { MarkdownTrace } from "./trace"
import { YAMLParse, YAMLStringify } from "./yaml"
import { createParsers } from "./parsers"
import { upsert, search } from "./retrieval"
import { readText } from "./fs"
import {
    PromptNode,
    appendChild,
    createFileMergeNode,
    createFunctionNode,
    createImageNode,
    createOutputProcessor,
    createSchemaNode,
} from "./promptdom"
import { bingSearch } from "./search"
import { createDefDataNode } from "./filedom"
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

function stringLikeToFileName(f: string | LinkedFile) {
    return typeof f === "string" ? f : f?.filename
}

export function createPromptContext(
    vars: ExpansionVariables,
    trace: MarkdownTrace,
    options: RunTemplateOptions,
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
        parse: XMLParse
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
    const fs = host.fs

    const retrieval: Retrieval = {
        webSearch: async (q) => {
            try {
                trace.startDetails(`🌐 retrieval web search \`${q}\``)
                const { webPages } = (await bingSearch(q, { trace })) || {}
                return <SearchResult>{
                    webPages: webPages?.value?.map(
                        ({ url, name, snippet }) =>
                            <LinkedFile>{
                                filename: url,
                                label: name,
                                content: snippet,
                            }
                    ),
                }
            } finally {
                trace.endDetails()
            }
        },
        search: async (q, files, searchOptions) => {
            searchOptions = searchOptions || {}
            try {
                trace.startDetails(`🔍 retrieval search \`${q}\``)
                if (!files?.length) {
                    trace.error("no files provided")
                    return { files: [], fragments: [] }
                } else {
                    await upsert(files, { trace, ...searchOptions })
                    const res = await search(q, {
                        ...searchOptions,
                        files: files.map(stringLikeToFileName),
                    })
                    trace.fence(res, "yaml")
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
            const file: LinkedFile = files
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

    const defSchema = (
        name: string,
        schema: JSONSchema,
        defOptions?: DefSchemaOptions
    ) => {
        trace.detailsFenced(
            `🧬 schema ${name}`,
            JSON.stringify(schema, null, 2),
            "json"
        )
        appendPromptChild(createSchemaNode(name, schema, defOptions))

        return name
    }

    const defOutput = (fn: PromptOutputProcessorHandler) => {
        if (fn) appendPromptChild(createOutputProcessor(fn))
    }

    const ctx = Object.freeze<PromptContext & RunPromptContextNode>({
        ...createRunPromptContext(options, env, trace),
        script: () => { },
        system: () => { },
        env,
        path,
        fs,
        parsers,
        YAML,
        CSV,
        INI,
        AICI,
        XML,
        retrieval,
        defImages,
        defSchema,
        defOutput,
        defFunction: (name, description, parameters, fn) => {
            appendPromptChild(
                createFunctionNode(name, description, parameters, fn)
            )
        },
        defFileMerge: (fn) => {
            appendPromptChild(createFileMergeNode(fn))
        },
        cancel: (reason?: string) => {
            throw new CancelError(reason || "user cancelled")
        },
        defData: (name, data, defOptions) => {
            appendPromptChild(createDefDataNode(name, data, env, defOptions))
            return name
        },
        fetchText: async (urlOrFile, fetchOptions) => {
            if (typeof urlOrFile === "string") {
                urlOrFile = {
                    label: urlOrFile,
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
            const file: LinkedFile = {
                label: urlOrFile.label,
                filename: urlOrFile.label,
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

export type RunTemplateOptions = ChatCompletionsOptions &
    ModelOptions & {
        cancellationToken?: CancellationToken
        infoCb?: (partialResponse: {
            text: string
            label?: string
            summary?: string
            vars?: Partial<ExpansionVariables>
        }) => void
        trace?: MarkdownTrace
        maxCachedTemperature?: number
        maxCachedTopP?: number
        skipLLM?: boolean
        label?: string
        cache?: boolean
        cliInfo?: {
            spec: string
        }
        languageModel?: LanguageModel
        vars?: Record<string, string>
    }
