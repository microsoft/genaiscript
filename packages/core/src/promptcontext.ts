// This file defines the creation of a prompt context, which includes various services
// like file operations, web search, fuzzy search, vector search, and more.
// The context is essential for executing prompts within a project environment.

import { host } from "./host"
import { arrayify, assert, dotGenaiscriptPath } from "./util"
import { runtimeHost } from "./host"
import { MarkdownTrace } from "./trace"
import { createParsers } from "./parsers"
import { bingSearch, tavilySearch } from "./websearch"
import {
    RunPromptContextNode,
    createChatGenerationContext,
} from "./runpromptcontext"
import { GenerationOptions } from "./generation"
import { fuzzSearch } from "./fuzzsearch"
import { grepSearch } from "./grep"
import { resolveFileContents, toWorkspaceFile } from "./file"
import { vectorSearch } from "./vectorsearch"
import { Project } from "./server/messages"
import { shellParse } from "./shell"
import { PLimitPromiseQueue } from "./concurrency"
import { NotSupportedError } from "./error"
import { MemoryCache } from "./cache"
import { proxifyVars } from "./vars"
import { HTMLEscape } from "./html"
import { hash } from "./crypto"
import { resolveModelConnectionInfo } from "./models"
import { DOCS_WEB_SEARCH_URL } from "./constants"
import { fetch, fetchText } from "./fetch"
import { fileWriteCached } from "./filecache"
import { join } from "node:path"

/**
 * Creates a prompt context for the given project, variables, trace, options, and model.
 * @param prj The project for which the context is created.
 * @param vars Expansion variables used in the context.
 * @param trace Markdown trace for logging purposes.
 * @param options Generation options for the prompt.
 * @param model The model identifier for context creation.
 * @returns A context object that includes methods and properties for prompt execution.
 */
export async function createPromptContext(
    prj: Project,
    ev: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions,
    model: string
) {
    const { generator, vars, output, ...varsNoGenerator } = ev
    // Clone variables to prevent modification of the original object
    const env = { generator, vars, output, ...structuredClone(varsNoGenerator) }
    assert(!!output, "missing output")
    // Create parsers for the given trace and model
    const parsers = await createParsers({ trace, model })
    const path = runtimeHost.path
    const runDir = ev.runDir
    assert(!!runDir, "missing run directory")

    // Define the workspace file system operations
    const workspace: WorkspaceFileSystem = {
        readText: (f) => runtimeHost.workspace.readText(f),
        readJSON: (f) => runtimeHost.workspace.readJSON(f),
        readYAML: (f) => runtimeHost.workspace.readYAML(f),
        readXML: (f, o) => runtimeHost.workspace.readXML(f, o),
        readCSV: (f, o) => runtimeHost.workspace.readCSV(f, o),
        readINI: (f, o) => runtimeHost.workspace.readINI(f, o),
        readData: (f, o) => runtimeHost.workspace.readData(f, o),
        writeText: (f, c) => runtimeHost.workspace.writeText(f, c),
        writeCached: async (f, options) => {
            const { scope } = options || {}
            const dir =
                scope === "run"
                    ? join(runDir, "files")
                    : dotGenaiscriptPath("cache", "files")
            return await fileWriteCached(f, dir)
        },
        copyFile: (src, dest) => runtimeHost.workspace.copyFile(src, dest),
        cache: (n) => runtimeHost.workspace.cache(n),
        findFiles: async (pattern, options) => {
            // Log and find files matching the given pattern
            const res = await runtimeHost.workspace.findFiles(pattern, options)
            trace.files(res, {
                title: `🗃 find files <code>${HTMLEscape(pattern)}</code>`,
                maxLength: -1,
                secrets: env.secrets,
            })
            return res
        },
        stat: (filename) => runtimeHost.workspace.stat(filename),
        grep: async (
            query,
            grepOptions: string | WorkspaceGrepOptions,
            grepOptions2?: WorkspaceGrepOptions
        ) => {
            if (typeof grepOptions === "string") {
                const p = runtimeHost.path
                    .dirname(grepOptions)
                    .replace(/(^|\/)\*\*$/, "")
                const g = runtimeHost.path.basename(grepOptions)
                grepOptions = {
                    path: p || undefined,
                    glob: g || undefined,
                    ...(grepOptions2 || {}),
                } as WorkspaceGrepOptions
            }
            const { path, glob, ...rest } = grepOptions || {}
            const grepTrace = trace.startTraceDetails(
                `🌐 grep ${HTMLEscape(typeof query === "string" ? query : query.source)} ${glob ? `--glob ${glob}` : ""} ${path || ""}`
            )
            try {
                const { files, matches } = await grepSearch(query, {
                    path: arrayify(path),
                    glob: arrayify(glob),
                    ...rest,
                    trace: grepTrace,
                })
                grepTrace.files(matches, { model, secrets: env.secrets })
                return { files, matches }
            } finally {
                grepTrace.endDetails()
            }
        },
    }

    // Define retrieval operations
    const retrieval: Retrieval = {
        webSearch: async (q, options) => {
            const { provider, count, ignoreMissingProvider } = options || {}
            // Conduct a web search and return the results
            const webTrace = trace.startTraceDetails(
                `🌐 web search <code>${HTMLEscape(q)}</code>`
            )
            try {
                let files: WorkspaceFile[]
                if (provider === "bing")
                    files = await bingSearch(q, { trace: webTrace, count })
                else if (provider === "tavily")
                    files = await tavilySearch(q, { trace: webTrace, count })
                else {
                    for (const f of [bingSearch, tavilySearch]) {
                        files = await f(q, {
                            ignoreMissingApiKey: true,
                            trace: webTrace,
                            count,
                        })
                        if (files) break
                    }
                }
                if (!files) {
                    if (ignoreMissingProvider) {
                        webTrace.log(`no search provider configured`)
                        return undefined
                    }
                    throw new Error(
                        `No search provider configured. See ${DOCS_WEB_SEARCH_URL}.`
                    )
                }
                webTrace.files(files, { model, secrets: env.secrets })
                return files
            } finally {
                webTrace.endDetails()
            }
        },
        fuzzSearch: async (q, files_, searchOptions) => {
            // Perform a fuzzy search on the provided files
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
            // Perform a vector-based search on the provided files
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
                    runtimeHost.modelAliases.embeddings.model
                const key = await hash({ files, searchOptions }, { length: 12 })
                const folderPath = dotGenaiscriptPath("vectors", key)
                const res = await vectorSearch(q, files, {
                    ...searchOptions,
                    folderPath,
                    trace: vecTrace,
                })
                // Log search results
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

    // Define the host for executing commands, browsing, and other operations
    const promptHost: PromptHost = Object.freeze<PromptHost>({
        fetch: (url, options) => fetch(url, { ...(options || {}), trace }),
        fetchText: (url, options) =>
            fetchText(url, { ...(options || {}), trace }),
        resolveLanguageModel: async (modelId) => {
            const { configuration } = await resolveModelConnectionInfo(
                { model: modelId },
                {
                    token: false,
                    trace,
                }
            )
            return {
                provider: configuration.provider,
                model: configuration.model,
            } satisfies LanguageModelReference
        },
        cache: async (name: string) => {
            if (!name) throw new NotSupportedError("missing cache name")
            const res = MemoryCache.byName<any, any>(name)
            return res
        },
        exec: async (
            command: string,
            args?: string[] | ShellOptions,
            options?: ShellOptions
        ) => {
            // Parse the command and arguments if necessary
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
            // Execute the command using the runtime host
            const res = await runtimeHost.exec(undefined, command, args, {
                cwd: options?.cwd,
                trace,
            })
            return res
        },
        browse: async (url, options) => {
            // Browse a URL and return the result
            const res = await runtimeHost.browse(url, {
                trace,
                ...(options || {}),
            })
            return res
        },
        container: async (options) => {
            // Execute operations within a container and return the result
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
        promiseQueue: (concurrency) => new PLimitPromiseQueue(concurrency),
        contentSafety: async (id) =>
            await runtimeHost.contentSafety(id || options?.contentSafety, {
                trace,
            }),
        python: async (options) =>
            await runtimeHost.python({ trace, ...(options || {}) }),
    })

    // Freeze project options to prevent modification
    const projectOptions = Object.freeze({ prj, env })
    const ctx: PromptContext & RunPromptContextNode = {
        ...createChatGenerationContext(options, trace, projectOptions),
        script: () => {},
        system: () => {},
        env: undefined, // set later
        path,
        fs: workspace,
        workspace,
        parsers,
        retrieval,
        host: promptHost,
    }
    env.generator = ctx
    env.vars = proxifyVars(env.vars)
    ctx.env = Object.freeze<ExpansionVariables>(env as ExpansionVariables)

    return ctx
}
