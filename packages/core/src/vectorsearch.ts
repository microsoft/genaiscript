/**
 * This module provides functionality for creating embeddings using OpenAI's API
 * and performing vector search on documents.
 */

import { TraceOptions } from "./trace"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { resolveFileContent } from "./file"
import { vectraWorkspaceFileIndex } from "./vectra"
import { azureAISearchIndex } from "./azureaisearch"
import { WorkspaceFileIndexCreator } from "./chat"
import { resolveModelConnectionInfo } from "./models"
import { EMBEDDINGS_MODEL_ID } from "./constants"
import { runtimeHost } from "./host"
import { resolveLanguageModel } from "./lm"

/**
 * Create a vector index for documents.
 */
export async function vectorIndex(
    indexName: string,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
): Promise<WorkspaceFileIndex> {
    const {
        type = "local",
        embeddingsModel,
        cancellationToken,
        trace,
    } = options || {}

    let factory: WorkspaceFileIndexCreator
    if (type === "azure_ai_search") factory = azureAISearchIndex
    else factory = vectraWorkspaceFileIndex

    // Resolve connection info for the embeddings model
    const { info, configuration } = await resolveModelConnectionInfo(
        {
            model: embeddingsModel,
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

    // Pull the model
    await runtimeHost.pullModel(configuration, { trace, cancellationToken })
    checkCancelled(cancellationToken)

    return await factory(indexName, configuration, embedder, options)
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
    const {
        topK,
        embeddingsModel,
        minScore = 0,
        cancellationToken,
        trace,
    } = options

    trace?.startDetails(`🔍 embeddings`)
    try {
        indexName = indexName || "default"
        trace?.itemValue(`name`, indexName)
        trace?.itemValue(`model`, embeddingsModel)
        const index = await vectorIndex(indexName, {
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
