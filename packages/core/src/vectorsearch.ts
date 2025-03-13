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

/**
 * Create a vector index for documents.
 */
export async function vectorIndex(
    indexName: string,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
): Promise<WorkspaceFileIndex> {
    const { type = "local" } = options || {}

    let factory: WorkspaceFileIndexCreator
    if (type === "azure_ai_search") factory = azureAISearchIndex
    else factory = vectraWorkspaceFileIndex

    return await factory(indexName, options)
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
            await index.upload(file)
            checkCancelled(cancellationToken)
        }
        const r = await index.search(query, { topK, minScore })
        return r
    } finally {
        trace?.endDetails()
    }
}
