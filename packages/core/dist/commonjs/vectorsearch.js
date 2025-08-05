"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCachedEmbedder = createCachedEmbedder;
exports.vectorCreateIndex = vectorCreateIndex;
exports.vectorIndex = vectorIndex;
exports.vectorSearch = vectorSearch;
const cancellation_js_1 = require("./cancellation.js");
const file_js_1 = require("./file.js");
const vectra_js_1 = require("./vectra.js");
const azureaisearch_js_1 = require("./azureaisearch.js");
const models_js_1 = require("./models.js");
const constants_js_1 = require("./constants.js");
const host_js_1 = require("./host.js");
const lm_js_1 = require("./lm.js");
const assert_js_1 = require("./assert.js");
const cache_js_1 = require("./cache.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("vector");
/**
 * Creates a cached embedding function that stores and retrieves embeddings
 * results from a cache before invoking the provided embedding function.
 *
 * @param embedder The original embedding function to wrap with caching.
 * @param options Configuration options for caching.
 * @param options.cacheName The name of the cache to be used. Defaults to "embeddings" if not provided.
 * @param options.cacheSalt An optional string used as a salt to differentiate cache keys.
 * @returns A wrapped embedding function with caching capabilities.
 *
 * The returned function takes inputs, configuration, and options, checks the cache for existing results,
 * and if not found, invokes the original embedding function, caches the result, and returns it.
 */
function createCachedEmbedder(embedder, options) {
    const { cacheName, cacheSalt } = options || {};
    const cache = (0, cache_js_1.createCache)(cacheName || "embeddings", { type: "fs" });
    return async (inputs, cfg, options) => {
        const key = {
            base: "embeddings",
            provider: "openai",
            model: "default",
            inputs,
            salt: cacheSalt,
        };
        const cached = await cache.get(key);
        if (cached)
            return cached;
        const result = await embedder(inputs, cfg, options);
        if (result.status === "success")
            await cache.set(key, result);
        return result;
    };
}
/**
 * Creates a vector index for documents using embeddings.
 *
 * @param indexName The name of the index to create.
 * @param options Configuration options, including index type, embeddings model, cancellation token, tracing, vector size, provider, and other runtime settings.
 * If the vector size is not provided, it will be determined automatically by generating a sample embedding.
 * @returns A workspace file index instance.
 */
async function vectorCreateIndex(indexName, options) {
    (0, assert_js_1.assert)(!!indexName);
    options = options || {};
    const { type = "local", embeddingsModel, cancellationToken, trace } = options || {};
    dbg(`create index %s %s %s`, indexName, type, embeddingsModel);
    let factory;
    if (type === "azure_ai_search")
        factory = azureaisearch_js_1.azureAISearchIndex;
    else
        factory = vectra_js_1.vectraWorkspaceFileIndex;
    // Resolve connection info for the embeddings model
    const { info, configuration } = await (0, models_js_1.resolveModelConnectionInfo)({
        model: embeddingsModel || constants_js_1.EMBEDDINGS_MODEL_ID,
    }, {
        token: true,
        defaultModel: constants_js_1.EMBEDDINGS_MODEL_ID,
    });
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    if (info.error)
        throw new Error(info.error);
    if (!configuration)
        throw new Error("No configuration found for vector search");
    // get embedder
    const { embedder } = await (0, lm_js_1.resolveLanguageModel)(info.provider);
    if (!embedder)
        throw new Error(`${info.provider} does not support embeddings`);
    const cachedEmbedder = createCachedEmbedder(embedder);
    // Pull the model
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    await runtimeHost.pullModel(configuration, { trace, cancellationToken });
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    if (!options.vectorSize) {
        dbg(`sniffing vector size for %s`, indexName);
        const sniff = await cachedEmbedder(`Lorem ipsum dolor sit amet, consectetur adipiscing elit
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`, configuration, options);
        const vectorSize = sniff.data?.[0]?.length;
        dbg(`sniffed vector size: %o`, vectorSize);
        if (isNaN(vectorSize))
            throw new Error("embeddings: unable to determine vector size");
        options.vectorSize = vectorSize;
    }
    return await factory(indexName, configuration, cachedEmbedder, options);
}
/**
 * Indexes a set of files into a vector index using embeddings.
 * @param indexName The name of the index to create or update. Defaults to "default" if not provided.
 * @param files The list of files to index. Their content will be resolved before indexing.
 * @param options Configuration options, including embeddings model, cancellation token, tracing, and other runtime settings.
 */
async function vectorIndex(indexName, files, options) {
    indexName = indexName || "default";
    const { embeddingsModel, cancellationToken, trace } = options;
    trace?.startDetails(`🔍 embeddings: indexing`);
    try {
        indexName = indexName || "default";
        trace?.itemValue(`name`, indexName);
        trace?.itemValue(`model`, embeddingsModel);
        const index = await vectorCreateIndex(indexName, {
            ...options,
            trace: trace,
        });
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        for (const file of files) {
            await (0, file_js_1.resolveFileContent)(file, { trace });
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            await index.insertOrUpdate(file);
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
        }
    }
    finally {
        trace?.endDetails();
    }
}
/**
 * Performs a vector search on documents using an index and query.
 * @param indexName The name of the index to search. Defaults to "default" if not provided.
 * @param query The query string used for the search.
 * @param files The files to search within. Their content will be resolved and indexed.
 * @param options Options for vector search, including top results, minimum score, embeddings model, cancellation token, and tracing.
 * @param options.topK The maximum number of top results to return.
 * @param options.minScore The minimum score threshold for results. Defaults to 0.
 * @param options.embeddingsModel The embeddings model to use for the search.
 * @param options.cancellationToken A token to handle cancellation of the operation.
 * @param options.trace An optional tracing object to log details of the operation.
 * @returns A list of files with scores reflecting their relevance to the query.
 */
async function vectorSearch(indexName, query, files, options) {
    indexName = indexName || "default";
    const { topK, embeddingsModel, minScore = 0, cancellationToken, trace } = options;
    dbg(`search index %s for query %s using model %s`, indexName, query, embeddingsModel);
    dbg(`files: %O`, files.map((f) => f.filename));
    trace?.startDetails(`🔍 embeddings: searching`);
    try {
        trace?.itemValue(`name`, indexName);
        trace?.itemValue(`model`, embeddingsModel);
        const index = await vectorCreateIndex(indexName, {
            ...options,
            trace: trace,
        });
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        for (const file of files) {
            await (0, file_js_1.resolveFileContent)(file, { trace });
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            await index.insertOrUpdate(file);
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
        }
        const r = await index.search(query, { topK, minScore });
        return r;
    }
    finally {
        trace?.endDetails();
    }
}
//# sourceMappingURL=vectorsearch.js.map