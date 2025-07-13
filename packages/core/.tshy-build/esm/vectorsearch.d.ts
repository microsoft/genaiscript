/**
 * This module provides functionality for creating embeddings using OpenAI's API
 * and performing vector search on documents.
 */
import { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
import { EmbeddingFunction } from "./chat.js";
import type { VectorIndexOptions, VectorSearchOptions, WorkspaceFile, WorkspaceFileIndex, WorkspaceFileWithScore } from "./types.js";
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
export declare function createCachedEmbedder(embedder: EmbeddingFunction, options?: {
    cacheName?: string;
    cacheSalt?: string;
}): EmbeddingFunction;
/**
 * Creates a vector index for documents using embeddings.
 *
 * @param indexName The name of the index to create.
 * @param options Configuration options, including index type, embeddings model, cancellation token, tracing, vector size, provider, and other runtime settings.
 * If the vector size is not provided, it will be determined automatically by generating a sample embedding.
 * @returns A workspace file index instance.
 */
export declare function vectorCreateIndex(indexName: string, options?: VectorIndexOptions & TraceOptions & CancellationOptions): Promise<WorkspaceFileIndex>;
/**
 * Indexes a set of files into a vector index using embeddings.
 * @param indexName The name of the index to create or update. Defaults to "default" if not provided.
 * @param files The list of files to index. Their content will be resolved before indexing.
 * @param options Configuration options, including embeddings model, cancellation token, tracing, and other runtime settings.
 */
export declare function vectorIndex(indexName: string, files: WorkspaceFile[], options: VectorSearchOptions & TraceOptions & CancellationOptions): Promise<void>;
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
export declare function vectorSearch(indexName: string, query: string, files: WorkspaceFile[], options: VectorSearchOptions & TraceOptions & CancellationOptions): Promise<WorkspaceFileWithScore[]>;
//# sourceMappingURL=vectorsearch.d.ts.map