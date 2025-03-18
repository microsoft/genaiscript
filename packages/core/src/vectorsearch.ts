/**
 * This module provides functionality for creating embeddings using OpenAI's API
 * and performing vector search on documents.
 */

import { TraceOptions } from "./trace"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { resolveFileContent } from "./file"
import { vectraWorkspaceFileIndex } from "./vectra"
import { azureAISearchIndex } from "./azureaisearch"
import { EmbeddingFunction, WorkspaceFileIndexCreator } from "./chat"
import { resolveModelConnectionInfo } from "./models"
import { EMBEDDINGS_MODEL_ID } from "./constants"
import { runtimeHost } from "./host"
import { resolveLanguageModel } from "./lm"
import { JSONLineCache } from "./cache"
import { EmbeddingsResponse } from "vectra"
import { assert } from "./util"

/**
 * Represents the cache key for embeddings.
 * This is used to store and retrieve cached embeddings.
 */
interface EmbeddingsCacheKey {
    base: string
    provider: string
    model: string
    inputs: string
    salt?: string
}

/**
 * Type alias for the embeddings cache.
 * Maps cache keys to embedding responses.
 */
type EmbeddingsCache = JSONLineCache<EmbeddingsCacheKey, EmbeddingsResponse>

export function createCachedEmbedder(
    embedder: EmbeddingFunction,
    options?: { cacheName?: string; cacheSalt?: string }
): EmbeddingFunction {
    const { cacheName, cacheSalt } = options || {}
    const cache: EmbeddingsCache = JSONLineCache.byName<
        EmbeddingsCacheKey,
        EmbeddingsResponse
    >(cacheName || "embeddings")

    return async (inputs: string, cfg, options) => {
        const key: EmbeddingsCacheKey = {
            base: "embeddings",
            provider: "openai",
            model: "default",
            inputs,
            salt: cacheSalt,
        }
        const cached = await cache.get(key)
        if (cached) return cached
        const result = await embedder(inputs, cfg, options)
        if (result.status === "success") await cache.set(key, result)
        return result
    }
}

/**
 * Create a vector index for documents.
 */
export async function vectorCreateIndex(
    indexName: string,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
): Promise<WorkspaceFileIndex> {
    assert(!!indexName)
    options = options || {}
    const {
        type = "local",
        embeddingsModel,
        cancellationToken,
        trace,
    } = options || {}

    let factory: WorkspaceFileIndexCreator
    if (type === "azure_ai_search" || type === "github")
        factory = azureAISearchIndex
    else factory = vectraWorkspaceFileIndex

    // Resolve connection info for the embeddings model
    const { info, configuration } = await resolveModelConnectionInfo(
        {
            model: embeddingsModel || EMBEDDINGS_MODEL_ID,
        },
        {
            token: true,
            defaultModel: EMBEDDINGS_MODEL_ID,
        }
    )
    checkCancelled(cancellationToken)
    if (info.error) throw new Error(info.error)
    if (!configuration)
        throw new Error("No configuration found for vector search")
    // get embedder
    const { embedder } = await resolveLanguageModel(info.provider)
    if (!embedder)
        throw new Error(`${info.provider} does not support embeddings`)

    const cachedEmbedder = createCachedEmbedder(embedder)
    // Pull the model
    await runtimeHost.pullModel(configuration, { trace, cancellationToken })
    checkCancelled(cancellationToken)

    if (!options.vectorSize) {
        const sniff = await cachedEmbedder(
            `Lorem ipsum dolor sit amet, consectetur adipiscing elit
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
            configuration,
            options
        )
        options.vectorSize = sniff.data[0].length
    }

    return await factory(
        indexName,
        configuration,
        cachedEmbedder,
        options
    )
}

/**
 * Performs a vector search on documents based on a query.
 * @param query The search query.
 * @param files The files to search within.
 * @param options Options for vector search, including folder path and tracing.
 * @returns The files with scores based on relevance to the query.
 */
export async function vectorIndex(
    indexName: string,
    files: WorkspaceFile[],
    options: VectorSearchOptions & TraceOptions & CancellationOptions
): Promise<void> {
    indexName = indexName || "default"
    const { embeddingsModel, cancellationToken, trace } = options

    trace?.startDetails(`🔍 embeddings: indexing`)
    try {
        indexName = indexName || "default"
        trace?.itemValue(`name`, indexName)
        trace?.itemValue(`model`, embeddingsModel)
        const index = await vectorCreateIndex(indexName, {
            ...options,
            trace: trace,
        })
        checkCancelled(cancellationToken)
        for (const file of files) {
            await resolveFileContent(file, { trace })
            checkCancelled(cancellationToken)
            await index.insertOrUpdate(file)
            checkCancelled(cancellationToken)
        }
    } finally {
        trace?.endDetails()
    }
}

/**
 * Performs a vector search on documents based on a query.
 * @param query The search query.
 * @param files The files to search within.
 * @param options Options for vector search, including folder path and tracing.
 * @returns The files with scores based on relevance to the query.
 */
export async function vectorSearch(
    indexName: string,
    query: string,
    files: WorkspaceFile[],
    options: VectorSearchOptions & TraceOptions & CancellationOptions
): Promise<WorkspaceFileWithScore[]> {
    indexName = indexName || "default"
    const {
        topK,
        embeddingsModel,
        minScore = 0,
        cancellationToken,
        trace,
    } = options

    trace?.startDetails(`🔍 embeddings: searching`)
    try {
        trace?.itemValue(`name`, indexName)
        trace?.itemValue(`model`, embeddingsModel)
        const index = await vectorCreateIndex(indexName, {
            ...options,
            trace: trace,
        })
        checkCancelled(cancellationToken)
        for (const file of files) {
            await resolveFileContent(file, { trace })
            checkCancelled(cancellationToken)
            await index.insertOrUpdate(file)
            checkCancelled(cancellationToken)
        }
        const r = await index.search(query, { topK, minScore })
        return r
    } finally {
        trace?.endDetails()
    }
}
