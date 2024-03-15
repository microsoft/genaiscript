import {
    ChatCompletionResponse,
    ChatCompletionsOptions,
    CreateChatCompletionRequest,
} from "./chat"
import { PromptTemplate } from "./ast"
import { logVerbose, toBase64 } from "./util"
import { fileTypeFromBuffer } from "file-type"
import { host } from "./host"
import { MarkdownTrace } from "./trace"
import { YAMLParse, YAMLStringify } from "./yaml"
import { createParsers } from "./parsers"
import { throwError } from "./error"
import { upsert, search } from "./retreival"
import { outline } from "./highlights"
import { readText } from "./fs"
import {
    PromptNode,
    appendChild,
    createFileMergeNode,
    createFunctioNode,
    createImageNode,
    createSchemaNode,
    createTextNode,
} from "./promptdom"
import { bingSearch } from "./search"
import { createDefDataNode } from "./filedom"
import { CancellationToken } from "./cancellation"
import {
    RunPromptContextNode,
    createRunPromptContext,
} from "./runpromptcontext"
import { CSVParse, CSVToMarkdown } from "./csv"

function stringLikeToFileName(f: string | LinkedFile) {
    return typeof f === "string" ? f : f?.filename
}

export function createPromptContext(
    r: PromptTemplate,
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
    const YAML: YAML = Object.freeze({
        stringify: YAMLStringify,
        parse: YAMLParse,
    })
    const CSV: CSV = Object.freeze({
        parse: CSVParse,
        mardownify: CSVToMarkdown,
    })
    const path = host.path
    const fs = host.fs

    const retreival: Retreival = {
        webSearch: async (q) => {
            try {
                trace.startDetails(`🌐 retreival web search \`${q}\``)
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
            } catch (e) {
                trace.error(`web search error`, e)
                return undefined
            } finally {
                trace.endDetails()
            }
        },
        search: async (q, files, options) => {
            options = options || {}
            try {
                trace.startDetails(`🔍 retreival search \`${q}\``)
                if (!files?.length) {
                    trace.error("no files provided")
                    return { files: [], fragments: [] }
                } else {
                    await upsert(files, { trace, ...options })
                    const res = await search(q, {
                        ...options,
                        files: files.map(stringLikeToFileName),
                    })
                    trace.fence(res, "yaml")
                    return res
                }
            } finally {
                trace.endDetails()
            }
        },
        outline: async (files) => {
            try {
                trace.startDetails(
                    `🫥 retreival outline (${files?.length || 0} files)`
                )
                const res = await outline(files, { trace })
                return res?.response
            } finally {
                trace.endDetails()
            }
        },
    }

    const defImages = (files: StringLike, options?: DefImagesOptions) => {
        const { detail } = options || {}
        if (Array.isArray(files))
            files.forEach((file) => defImages(file, options))
        else if (typeof files === "string")
            appendPromptChild(createImageNode({ url: files, detail }))
        else {
            const file: LinkedFile = files
            appendPromptChild(
                createImageNode(
                    (async () => {
                        let bytes: Uint8Array
                        if (/^https?:\/\//i.test(file.filename)) {
                            const resp = await fetch(file.filename)
                            if (!resp.ok) return undefined
                            const buffer = await resp.arrayBuffer()
                            bytes = new Uint8Array(buffer)
                        } else {
                            bytes = new Uint8Array(
                                await host.readFile(file.filename)
                            )
                        }
                        const mime = (await fileTypeFromBuffer(bytes))?.mime
                        if (
                            !mime ||
                            !/^image\/(png|jpeg|webp|gif)$/i.test(mime)
                        )
                            return undefined
                        const b64 = toBase64(bytes)
                        return {
                            url: `data:${mime};base64,${b64}`,
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
        options?: DefSchemaOptions
    ) => {
        trace.detailsFenced(
            `🧬 schema ${name}`,
            JSON.stringify(schema, null, 2),
            "json"
        )
        appendPromptChild(createSchemaNode(name, schema, options))

        return name
    }

    const ctx = Object.freeze<PromptContext & RunPromptContextNode>({
        ...createRunPromptContext(options, env, trace),
        script: () => {},
        system: () => {},
        env,
        path,
        fs,
        parsers,
        YAML,
        CSV,
        retreival,
        defImages,
        defSchema,
        defFunction: (name, description, parameters, fn) => {
            appendPromptChild(
                createFunctioNode(name, description, parameters, fn)
            )
        },
        defFileMerge: (fn) => {
            appendPromptChild(createFileMergeNode(fn))
        },
        cancel: (reason?: string) => {
            throwError(reason || "user cancelled", true)
        },
        defData: (name, data, options) => {
            appendPromptChild(createDefDataNode(name, data, env, options))
            return name
        },
        writeText: (body) => {
            appendPromptChild(
                createTextNode(body.replace(/\n*$/, "").replace(/^\n*/, ""))
            )
            const idx = body.indexOf(vars.error)
            if (idx >= 0) {
                const msg = body
                    .slice(idx + vars.error.length)
                    .replace(/\n[^]*/, "")
                throw new Error(msg)
            }
        },
        fetchText: async (urlOrFile, options) => {
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
                const resp = await fetch(url, options)
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
        getChatCompletions?: (
            req: CreateChatCompletionRequest,
            options?: ChatCompletionsOptions & { trace: MarkdownTrace }
        ) => Promise<ChatCompletionResponse>
        vars?: Record<string, string>
    }
