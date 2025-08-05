"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPromptContext = createPromptContext;
// This file defines the creation of a prompt context, which includes various services
// like file operations, web search, fuzzy search, vector search, and more.
// The context is essential for executing prompts within a project environment.
const debug_1 = __importDefault(require("debug"));
const assert_js_1 = require("./assert.js");
const cleaners_js_1 = require("./cleaners.js");
const host_js_1 = require("./host.js");
const websearch_js_1 = require("./websearch.js");
const runpromptcontext_js_1 = require("./runpromptcontext.js");
const fuzzsearch_js_1 = require("./fuzzsearch.js");
const grep_js_1 = require("./grep.js");
const file_js_1 = require("./file.js");
const vectorsearch_js_1 = require("./vectorsearch.js");
const shell_js_1 = require("./shell.js");
const concurrency_js_1 = require("./concurrency.js");
const vars_js_1 = require("./vars.js");
const htmlescape_js_1 = require("./htmlescape.js");
const crypto_js_1 = require("./crypto.js");
const models_js_1 = require("./models.js");
const constants_js_1 = require("./constants.js");
const fetch_js_1 = require("./fetch.js");
const fetchtext_js_1 = require("./fetchtext.js");
const filecache_js_1 = require("./filecache.js");
const node_path_1 = require("node:path");
const teams_js_1 = require("./teams.js");
const workdir_js_1 = require("./workdir.js");
const cache_js_1 = require("./cache.js");
const debug_js_1 = require("./debug.js");
const config_js_1 = require("./config.js");
const cleaners_js_2 = require("./cleaners.js");
const dbgc = (0, debug_js_1.genaiscriptDebug)("ctx");
/**
 * Creates a prompt context for the specified project, variables, trace, options, and model.
 *
 * @param prj The project for which the context is created.
 * @param ev Expansion variables including generator, output, debugging, run directory, and other configurations.
 * @param trace Markdown trace for logging and debugging.
 * @param options Generation options such as cancellation tokens, embeddings models, and content safety.
 * @param model The model identifier used for context creation.
 * @returns A context object providing methods for file operations, web retrieval, searches, execution, container operations, caching, and other utilities. Includes workspace file system operations (read/write files, grep, find files), retrieval methods (web search, fuzzy search, vector search, index creation), and host operations (command execution, browsing, container management, resource publishing, server management, etc.).
 */
async function createPromptContext(prj, ev, options, model) {
    const { trace, cancellationToken } = options;
    const { generator, vars, dbg, output, ...varsNoGenerator } = ev;
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    dbgc(`create`);
    // Clone variables to prevent modification of the original object
    const env = {
        generator,
        vars,
        output,
        dbg,
        ...structuredClone(varsNoGenerator),
    };
    (0, assert_js_1.assert)(!!output, "missing output");
    // Create parsers for the given trace and model
    const path = runtimeHost.path;
    const runDir = ev.runDir;
    (0, assert_js_1.assert)(!!runDir, "missing run directory");
    // Define the workspace file system operations
    const workspace = {
        readText: (f) => runtimeHost.workspace.readText(f),
        readJSON: (f, o) => runtimeHost.workspace.readJSON(f, o),
        readYAML: (f, o) => runtimeHost.workspace.readYAML(f, o),
        readXML: (f, o) => runtimeHost.workspace.readXML(f, o),
        readCSV: (f, o) => runtimeHost.workspace.readCSV(f, o),
        readINI: (f, o) => runtimeHost.workspace.readINI(f, o),
        readData: (f, o) => runtimeHost.workspace.readData(f, o),
        writeText: (f, c) => runtimeHost.workspace.writeText(f, c),
        appendText: (f, c) => runtimeHost.workspace.appendText(f, c),
        writeCached: async (f, options) => {
            const { scope } = options || {};
            const dir = scope === "run" ? (0, node_path_1.join)(runDir, "files") : (0, workdir_js_1.dotGenaiscriptPath)("cache", "files");
            return await (0, filecache_js_1.fileWriteCached)(dir, f, {
                ...(options || {}),
                cancellationToken,
                trace,
            });
        },
        copyFile: (src, dest) => runtimeHost.workspace.copyFile(src, dest),
        cache: (n) => runtimeHost.workspace.cache(n),
        findFiles: async (pattern, options) => {
            const res = await runtimeHost.workspace.findFiles(pattern, options);
            return res;
        },
        stat: (filename) => runtimeHost.workspace.stat(filename),
        writeFiles: (file) => runtimeHost.workspace.writeFiles(file),
        grep: async (query, grepOptions, grepOptions2) => {
            if (typeof grepOptions === "string") {
                const p = (0, node_path_1.dirname)(grepOptions).replace(/(^|\/)\*\*$/, "");
                const g = (0, node_path_1.basename)(grepOptions);
                grepOptions = {
                    path: p || undefined,
                    glob: g || undefined,
                    ...(grepOptions2 || {}),
                };
            }
            const { path, glob, ...rest } = grepOptions || {};
            const grepTrace = trace?.startTraceDetails(`🌐 grep ${(0, htmlescape_js_1.HTMLEscape)(typeof query === "string" ? query : query.source)} ${glob ? `--glob ${glob}` : ""} ${path || ""}`);
            try {
                const { files, matches } = await (0, grep_js_1.grepSearch)(query, {
                    path,
                    glob,
                    ...rest,
                    trace: grepTrace,
                    cancellationToken,
                });
                grepTrace?.files(matches, {
                    model,
                    secrets: env.secrets,
                    maxLength: 0,
                });
                return { files, matches };
            }
            finally {
                grepTrace?.endDetails();
            }
        },
    };
    // Define retrieval operations
    const retrieval = {
        webSearch: async (q, options) => {
            const { provider, count, ignoreMissingProvider } = options || {};
            // Conduct a web search and return the results
            const webTrace = trace?.startTraceDetails(`🌐 web search <code>${(0, htmlescape_js_1.HTMLEscape)(q)}</code>`);
            try {
                let files;
                if (provider === "bing")
                    throw new Error("Bing search is deprecated.");
                else if (provider === "tavily")
                    files = await (0, websearch_js_1.tavilySearch)(q, { trace: webTrace, count });
                else {
                    for (const f of [websearch_js_1.tavilySearch]) {
                        files = await f(q, {
                            ignoreMissingApiKey: true,
                            trace: webTrace,
                            count,
                        });
                        if (files)
                            break;
                    }
                }
                if (!files) {
                    if (ignoreMissingProvider) {
                        webTrace?.log(`no search provider configured`);
                        return undefined;
                    }
                    throw new Error(`No search provider configured. See ${constants_js_1.DOCS_WEB_SEARCH_URL}.`);
                }
                webTrace?.files(files, {
                    model,
                    secrets: env.secrets,
                    maxLength: 0,
                });
                return files;
            }
            finally {
                webTrace?.endDetails();
            }
        },
        fuzzSearch: async (q, files_, searchOptions) => {
            // Perform a fuzzy search on the provided files
            const files = (0, cleaners_js_1.arrayify)(files_);
            searchOptions = searchOptions || {};
            const fuzzTrace = trace?.startTraceDetails(`🧐 fuzz search <code>${(0, htmlescape_js_1.HTMLEscape)(q)}</code>`);
            try {
                if (!files?.length) {
                    fuzzTrace?.error("no files provided");
                    return [];
                }
                else {
                    const res = await (0, fuzzsearch_js_1.fuzzSearch)(q, files, {
                        ...searchOptions,
                        trace: fuzzTrace,
                    });
                    fuzzTrace?.files(res, {
                        model,
                        secrets: env.secrets,
                        skipIfEmpty: true,
                        maxLength: 0,
                    });
                    return res;
                }
            }
            finally {
                fuzzTrace?.endDetails();
            }
        },
        index: async (indexId, indexOptions) => {
            const opts = {
                ...(indexOptions || {}),
                embeddingsModel: indexOptions?.embeddingsModel || options?.embeddingsModel,
            };
            const res = await (0, vectorsearch_js_1.vectorCreateIndex)(indexId, {
                ...opts,
                trace,
                cancellationToken,
            });
            return res;
        },
        vectorSearch: async (q, files_, searchOptions) => {
            // Perform a vector-based search on the provided files
            const files = (0, cleaners_js_1.arrayify)(files_).map(file_js_1.toWorkspaceFile);
            searchOptions = { ...(searchOptions || {}) };
            const vecTrace = trace?.startTraceDetails(`🔍 vector search <code>${(0, htmlescape_js_1.HTMLEscape)(q)}</code>`);
            try {
                if (!files?.length) {
                    vecTrace?.error("no files provided");
                    return [];
                }
                await (0, file_js_1.resolveFileContents)(files);
                searchOptions.embeddingsModel = searchOptions?.embeddingsModel ?? options?.embeddingsModel;
                const key = searchOptions?.indexName ||
                    (await (0, crypto_js_1.hash)({ files, searchOptions }, { length: constants_js_1.VECTOR_INDEX_HASH_LENGTH }));
                const res = await (0, vectorsearch_js_1.vectorSearch)(key, q, files, {
                    ...searchOptions,
                    trace: vecTrace,
                    cancellationToken,
                });
                return res;
            }
            finally {
                vecTrace?.endDetails();
            }
        },
    };
    // Define the host for executing commands, browsing, and other operations
    const promptHost = Object.freeze({
        logger: (category) => (0, debug_1.default)(category),
        mcpServer: async (options) => await runtimeHost.mcp.startMcpServer(options, {
            trace,
            cancellationToken,
        }),
        publishResource: async (name, content, options) => await runtimeHost.resources.publishResource(name, content, options),
        resources: async () => await runtimeHost.resources.resources(),
        fetch: (url, options) => (0, fetch_js_1.fetch)(url, { ...(options || {}), trace }),
        fetchText: (url, options) => (0, fetchtext_js_1.fetchText)(url, { ...(options || {}), trace }),
        resolveLanguageModel: async (modelId) => {
            const { configuration } = await (0, models_js_1.resolveModelConnectionInfo)({ model: modelId }, {
                token: false,
                trace,
            });
            const res = {
                provider: configuration?.provider,
                model: configuration?.model,
                modelId: modelId,
            };
            dbgc(`model: %O`, res);
            return res;
        },
        resolveLanguageModelProvider: async (id, options) => {
            if (!id)
                throw new Error("provider id is required");
            const [provider] = await (0, config_js_1.resolveLanguageModelConfigurations)(id, {
                ...(options || {}),
                models: !!options?.listModels,
                error: false,
                hide: false,
                token: true,
            });
            if (provider.error) {
                dbgc(`Error resolving provider %s: %s`, id, provider.error);
                return undefined;
            }
            return (0, cleaners_js_2.deleteUndefinedValues)({
                id: provider.provider,
                error: provider.error,
                base: provider.base,
                version: provider.version,
                token: options?.token ? provider.token : undefined,
                models: options?.listModels ? provider.models || [] : undefined,
            });
        },
        cache: async (name) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = (0, cache_js_1.createCache)(name, { type: "memory" });
            return res;
        },
        exec: async (command, args, options) => {
            // Parse the command and arguments if necessary
            if (!Array.isArray(args) && typeof args === "object") {
                // exec("cmd arg arg", {...})
                if (options !== undefined)
                    throw new Error("Options must be the second argument");
                options = args;
                const parsed = (0, shell_js_1.shellParse)(command);
                command = parsed[0];
                args = parsed.slice(1);
            }
            else if (args === undefined) {
                // exec("cmd arg arg")
                const parsed = (0, shell_js_1.shellParse)(command);
                command = parsed[0];
                args = parsed.slice(1);
            }
            // Execute the command using the runtime host
            const res = await runtimeHost.exec(undefined, command, args, {
                ...(options || {}),
                trace,
            });
            return res;
        },
        container: async (options) => {
            // Execute operations within a container and return the result
            const res = await runtimeHost.container({
                ...(options || {}),
                trace,
            });
            return res;
        },
        select: async (message, choices, options) => await runtimeHost.select(message, choices, options),
        input: async (message) => await runtimeHost.input(message),
        confirm: async (message) => await runtimeHost.confirm(message),
        promiseQueue: (concurrency) => new concurrency_js_1.PLimitPromiseQueue(concurrency),
        contentSafety: async (id) => await runtimeHost.contentSafety(id || options?.contentSafety, {
            trace,
        }),
        teamsChannel: async (url) => (0, teams_js_1.createMicrosoftTeamsChannelClient)(url),
    });
    // Freeze project options to prevent modification
    const projectOptions = Object.freeze({ prj, env });
    const ctx = {
        ...(0, runpromptcontext_js_1.createChatGenerationContext)(options, trace, projectOptions),
        script: () => { },
        system: () => { },
        env: undefined, // set later
        path,
        workspace,
        retrieval,
        host: promptHost,
    };
    env.generator = ctx;
    env.vars = (0, vars_js_1.proxifyEnvVars)(env.vars);
    ctx.env = Object.freeze(env);
    return ctx;
}
//# sourceMappingURL=promptcontext.js.map