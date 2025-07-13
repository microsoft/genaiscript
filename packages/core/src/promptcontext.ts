// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This file defines the creation of a prompt context, which includes various services
// like file operations, web search, fuzzy search, vector search, and more.
// The context is essential for executing prompts within a project environment.
import debug from "debug";
import { assert } from "./assert.js";
import { arrayify } from "./cleaners.js";
import { runtimeHost } from "./host.js";
import { bingSearch, tavilySearch } from "./websearch.js";
import { RunPromptContextNode, createChatGenerationContext } from "./runpromptcontext.js";
import { GenerationOptions } from "./generation.js";
import { fuzzSearch } from "./fuzzsearch.js";
import { grepSearch } from "./grep.js";
import { resolveFileContents, toWorkspaceFile } from "./file.js";
import { vectorCreateIndex, vectorSearch } from "./vectorsearch.js";
import { Project } from "./server/messages.js";
import { shellParse } from "./shell.js";
import { PLimitPromiseQueue } from "./concurrency.js";
import { proxifyEnvVars } from "./vars.js";
import { HTMLEscape } from "./htmlescape.js";
import { hash } from "./crypto.js";
import { resolveModelConnectionInfo } from "./models.js";
import { DOCS_WEB_SEARCH_URL, VECTOR_INDEX_HASH_LENGTH } from "./constants.js";
import { fetch } from "./fetch.js";
import { fetchText } from "./fetchtext.js";
import { fileWriteCached } from "./filecache.js";
import { join } from "node:path";
import { createMicrosoftTeamsChannelClient } from "./teams.js";
import { dotGenaiscriptPath } from "./workdir.js";
import { createCache } from "./cache.js";
import { genaiscriptDebug } from "./debug.js";
import { resolveLanguageModelConfigurations } from "./config.js";
import { deleteUndefinedValues } from "./cleaners.js";
import type {
  ExpansionVariables,
  LanguageModelProviderInfo,
  LanguageModelReference,
  PromptContext,
  PromptHost,
  Retrieval,
  ShellOptions,
  WorkspaceFile,
  WorkspaceFileSystem,
  WorkspaceGrepOptions,
} from "./types.js";

const dbgc = genaiscriptDebug("ctx");

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
export async function createPromptContext(
  prj: Project,
  ev: ExpansionVariables,
  options: GenerationOptions,
  model: string,
) {
  const { trace, cancellationToken } = options;
  const { generator, vars, dbg, output, ...varsNoGenerator } = ev;

  dbgc(`create`);
  // Clone variables to prevent modification of the original object
  const env = {
    generator,
    vars,
    output,
    dbg,
    ...structuredClone(varsNoGenerator),
  };
  assert(!!output, "missing output");
  // Create parsers for the given trace and model
  const path = runtimeHost.path;
  const runDir = ev.runDir;
  assert(!!runDir, "missing run directory");

  // Define the workspace file system operations
  const workspace: WorkspaceFileSystem = {
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
      const dir = scope === "run" ? join(runDir, "files") : dotGenaiscriptPath("cache", "files");
      return await fileWriteCached(dir, f, {
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
    grep: async (
      query,
      grepOptions: string | WorkspaceGrepOptions,
      grepOptions2?: WorkspaceGrepOptions,
    ) => {
      if (typeof grepOptions === "string") {
        const p = runtimeHost.path.dirname(grepOptions).replace(/(^|\/)\*\*$/, "");
        const g = runtimeHost.path.basename(grepOptions);
        grepOptions = {
          path: p || undefined,
          glob: g || undefined,
          ...(grepOptions2 || {}),
        } as WorkspaceGrepOptions;
      }
      const { path, glob, ...rest } = grepOptions || {};
      const grepTrace = trace?.startTraceDetails(
        `🌐 grep ${HTMLEscape(typeof query === "string" ? query : query.source)} ${glob ? `--glob ${glob}` : ""} ${path || ""}`,
      );
      try {
        const { files, matches } = await grepSearch(query, {
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
      } finally {
        grepTrace?.endDetails();
      }
    },
  };

  // Define retrieval operations
  const retrieval: Retrieval = {
    webSearch: async (q, options) => {
      const { provider, count, ignoreMissingProvider } = options || {};
      // Conduct a web search and return the results
      const webTrace = trace?.startTraceDetails(`🌐 web search <code>${HTMLEscape(q)}</code>`);
      try {
        let files: WorkspaceFile[];
        if (provider === "bing") files = await bingSearch(q, { trace: webTrace, count });
        else if (provider === "tavily") files = await tavilySearch(q, { trace: webTrace, count });
        else {
          for (const f of [bingSearch, tavilySearch]) {
            files = await f(q, {
              ignoreMissingApiKey: true,
              trace: webTrace,
              count,
            });
            if (files) break;
          }
        }
        if (!files) {
          if (ignoreMissingProvider) {
            webTrace?.log(`no search provider configured`);
            return undefined;
          }
          throw new Error(`No search provider configured. See ${DOCS_WEB_SEARCH_URL}.`);
        }
        webTrace?.files(files, {
          model,
          secrets: env.secrets,
          maxLength: 0,
        });
        return files;
      } finally {
        webTrace?.endDetails();
      }
    },
    fuzzSearch: async (q, files_, searchOptions) => {
      // Perform a fuzzy search on the provided files
      const files = arrayify(files_);
      searchOptions = searchOptions || {};
      const fuzzTrace = trace?.startTraceDetails(`🧐 fuzz search <code>${HTMLEscape(q)}</code>`);
      try {
        if (!files?.length) {
          fuzzTrace?.error("no files provided");
          return [];
        } else {
          const res = await fuzzSearch(q, files, {
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
      } finally {
        fuzzTrace?.endDetails();
      }
    },
    index: async (indexId, indexOptions) => {
      const opts = {
        ...(indexOptions || {}),
        embeddingsModel: indexOptions?.embeddingsModel || options?.embeddingsModel,
      };
      const res = await vectorCreateIndex(indexId, {
        ...opts,
        trace,
        cancellationToken,
      });
      return res;
    },
    vectorSearch: async (q, files_, searchOptions) => {
      // Perform a vector-based search on the provided files
      const files = arrayify(files_).map(toWorkspaceFile);
      searchOptions = { ...(searchOptions || {}) };
      const vecTrace = trace?.startTraceDetails(`🔍 vector search <code>${HTMLEscape(q)}</code>`);
      try {
        if (!files?.length) {
          vecTrace?.error("no files provided");
          return [];
        }

        await resolveFileContents(files);
        searchOptions.embeddingsModel = searchOptions?.embeddingsModel ?? options?.embeddingsModel;
        const key =
          searchOptions?.indexName ||
          (await hash({ files, searchOptions }, { length: VECTOR_INDEX_HASH_LENGTH }));
        const res = await vectorSearch(key, q, files, {
          ...searchOptions,
          trace: vecTrace,
          cancellationToken,
        });
        return res;
      } finally {
        vecTrace?.endDetails();
      }
    },
  };

  // Define the host for executing commands, browsing, and other operations
  const promptHost: PromptHost = Object.freeze<PromptHost>({
    logger: (category) => debug(category),
    mcpServer: async (options) =>
      await runtimeHost.mcp.startMcpServer(options, {
        trace,
        cancellationToken,
      }),
    publishResource: async (name, content, options) =>
      await runtimeHost.resources.publishResource(name, content, options),
    resources: async () => await runtimeHost.resources.resources(),
    fetch: (url, options) => fetch(url, { ...(options || {}), trace }),
    fetchText: (url, options) => fetchText(url, { ...(options || {}), trace }),
    resolveLanguageModel: async (modelId) => {
      const { configuration } = await resolveModelConnectionInfo(
        { model: modelId },
        {
          token: false,
          trace,
        },
      );
      const res = {
        provider: configuration?.provider,
        model: configuration?.model,
        modelId: modelId,
      } satisfies LanguageModelReference;
      dbgc(`model: %O`, res);
      return res;
    },
    resolveLanguageModelProvider: async (id, options) => {
      if (!id) throw new Error("provider id is required");
      const [provider] = await resolveLanguageModelConfigurations(id, {
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
      return deleteUndefinedValues({
        id: provider.provider,
        error: provider.error,
        base: provider.base,
        version: provider.version,
        token: options?.token ? provider.token : undefined,
        models: options?.listModels ? provider.models || [] : undefined,
      } satisfies LanguageModelProviderInfo);
    },
    cache: async (name: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = createCache<any, any>(name, { type: "memory" });
      return res;
    },
    exec: async (command: string, args?: string[] | ShellOptions, options?: ShellOptions) => {
      // Parse the command and arguments if necessary
      if (!Array.isArray(args) && typeof args === "object") {
        // exec("cmd arg arg", {...})
        if (options !== undefined) throw new Error("Options must be the second argument");
        options = args as ShellOptions;
        const parsed = shellParse(command);
        command = parsed[0];
        args = parsed.slice(1);
      } else if (args === undefined) {
        // exec("cmd arg arg")
        const parsed = shellParse(command);
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
    browse: async (url, options) => {
      // Browse a URL and return the result
      const res = await runtimeHost.browse(url, {
        trace,
        ...(options || {}),
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
    select: async (message, choices, options) =>
      await runtimeHost.select(message, choices, options),
    input: async (message) => await runtimeHost.input(message),
    confirm: async (message) => await runtimeHost.confirm(message),
    promiseQueue: (concurrency) => new PLimitPromiseQueue(concurrency),
    contentSafety: async (id) =>
      await runtimeHost.contentSafety(id || options?.contentSafety, {
        trace,
      }),
    python: async (pyOptions) =>
      await runtimeHost.python({
        trace,
        cancellationToken,
        ...(pyOptions || {}),
      }),
    teamsChannel: async (url) => createMicrosoftTeamsChannelClient(url),
  });

  // Freeze project options to prevent modification
  const projectOptions = Object.freeze({ prj, env });
  const ctx: PromptContext & RunPromptContextNode = {
    ...createChatGenerationContext(options, trace, projectOptions),
    script: () => {},
    system: () => {},
    env: undefined, // set later
    path,
    workspace,
    retrieval,
    host: promptHost,
  };
  env.generator = ctx;
  env.vars = proxifyEnvVars(env.vars);
  ctx.env = Object.freeze<ExpansionVariables>(env as ExpansionVariables);

  return ctx;
}
