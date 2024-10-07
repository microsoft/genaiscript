// This file defines the creation of a prompt context, which includes various services
// like file operations, web search, fuzzy search, vector search, and more.
// The context is essential for executing prompts within a project environment.

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
} from "./promptdom"
import { bingSearch } from "./websearch"
import {
    RunPromptContextNode,
    createChatGenerationContext,
} from "./runpromptcontext"
import { GenerationOptions } from "./generation"
import { fuzzSearch } from "./fuzzsearch"
import { grepSearch } from "./grep"
import { resolveFileContents, toWorkspaceFile } from "./file"
import { vectorSearch } from "./vectorsearch"
import { Project } from "./ast"
import { shellParse } from "./shell"
import { PLimitPromiseQueue } from "./concurrency"

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
    vars: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions,
    model: string
) {
    const { generator, ...varsNoGenerator } = vars
    // Clone variables to prevent modification of the original object
    const env = { generator, ...structuredClone(varsNoGenerator) }
    // Create parsers for the given trace and model
    const parsers = await createParsers({ trace, model })
    const path = runtimeHost.path

    // Define the workspace file system operations
    const workspace: WorkspaceFileSystem = {
        readText: (f) => runtimeHost.workspace.readText(f),
        readJSON: (f) => runtimeHost.workspace.readJSON(f),
        readYAML: (f) => runtimeHost.workspace.readYAML(f),
        readXML: (f, o) => runtimeHost.workspace.readXML(f, o),
        readCSV: (f, o) => runtimeHost.workspace.readCSV(f, o),
        writeText: (f, c) => runtimeHost.workspace.writeText(f, c),
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
        grep: async (
            query,
            options: string | WorkspaceGrepOptions,
            options2?: WorkspaceGrepOptions
        ) => {
            if (typeof options === "string") {
                const p = runtimeHost.path
                    .dirname(options)
                    .replace(/(^|\/)\*\*$/, "")
                const g = runtimeHost.path.basename(options)
                options = <WorkspaceGrepOptions>{
                    path: p,
                    glob: g,
                    ...(options2 || {}),
                }
            }
            const { path, glob, ...rest } = options || {}
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
        webSearch: async (q) => {
            // Conduct a web search and return the results
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

    // Default output processor for the prompt
    const defOutputProcessor = (fn: PromptOutputProcessorHandler) => {
        if (fn) appendPromptChild(createOutputProcessor(fn))
    }

    // Define the host for executing commands, browsing, and other operations
    const promptHost: PromptHost = Object.freeze<PromptHost>({
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
        defOutputProcessor,
        defFileMerge: (fn) => {
            appendPromptChild(createFileMerge(fn))
        },
    }
    env.generator = ctx
    ctx.env = Object.freeze(env)

    // Append a prompt child node
    const appendPromptChild = (node: PromptNode) => {
        if (!ctx.node) throw new Error("Prompt closed")
        appendChild(ctx.node, node)
    }

    return ctx
}
