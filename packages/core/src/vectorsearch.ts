// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This module provides functionality for creating embeddings using OpenAI's API
 * and performing vector search on documents.
 */

import { TraceOptions } from "./trace.js";
import { CancellationOptions, checkCancelled } from "./cancellation.js";
import { resolveFileContent } from "./file.js";
import { vectraWorkspaceFileIndex } from "./vectra.js";
import { azureAISearchIndex } from "./azureaisearch.js";
import { EmbeddingFunction, WorkspaceFileIndexCreator } from "./chat.js";
import { resolveModelConnectionInfo } from "./models.js";
import { EMBEDDINGS_MODEL_ID } from "./constants.js";
import { runtimeHost } from "./host.js";
import { resolveLanguageModel } from "./lm.js";
import { assert } from "./assert.js";
import { createCache } from "./cache.js";
import type {
  VectorIndexOptions,
  VectorSearchOptions,
  WorkspaceFile,
  WorkspaceFileIndex,
  WorkspaceFileWithScore,
} from "./types.js";

interface EmbeddingsResponse {
  /**
   * Status of the embeddings response.
   */
  status: "success" | "error" | "rate_limited" | "cancelled";

  /**
   * Optional. Embeddings for the given inputs.
   */
  output?: number[][];

  /**
   * Optional. Message when status is not equal to `success`.
   */
  message?: string;

  /**
   * Optional. Model used to create the embeddings.
   */
  model?: string;

  /**
   * Optional. Usage statistics for the request.
   */
  usage?: Record<string, any>;
}

/**
 * Represents the cache key for embeddings.
 * This is used to store and retrieve cached embeddings.
 */
interface EmbeddingsCacheKey {
  base: string;
  provider: string;
  model: string;
  inputs: string;
  salt?: string;
}

/**
 * Type alias for the embeddings cache.
 * Maps cache keys to embedding responses.
 */
type EmbeddingsCache = WorkspaceFileCache<EmbeddingsCacheKey, EmbeddingsResponse>;

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
export function createCachedEmbedder(
  embedder: EmbeddingFunction,
  options?: { cacheName?: string; cacheSalt?: string },
): EmbeddingFunction {
  const { cacheName, cacheSalt } = options || {};
  const cache: EmbeddingsCache = createCache<EmbeddingsCacheKey, EmbeddingsResponse>(
    cacheName || "embeddings",
    { type: "fs" },
  );

  return async (inputs: string, cfg, options) => {
    const key: EmbeddingsCacheKey = {
      base: "embeddings",
      provider: "openai",
      model: "default",
      inputs,
      salt: cacheSalt,
    };
    const cached = await cache.get(key);
    if (cached) return cached;
    const result = await embedder(inputs, cfg, options);
    if (result.status === "success") await cache.set(key, result);
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
export async function vectorCreateIndex(
  indexName: string,
  options?: VectorIndexOptions & TraceOptions & CancellationOptions,
): Promise<WorkspaceFileIndex> {
  assert(!!indexName);
  options = options || {};
  const { type = "local", embeddingsModel, cancellationToken, trace } = options || {};

  let factory: WorkspaceFileIndexCreator;
  if (type === "azure_ai_search") factory = azureAISearchIndex;
  else factory = vectraWorkspaceFileIndex;

  // Resolve connection info for the embeddings model
  const { info, configuration } = await resolveModelConnectionInfo(
    {
      model: embeddingsModel || EMBEDDINGS_MODEL_ID,
    },
    {
      token: true,
      defaultModel: EMBEDDINGS_MODEL_ID,
    },
  );
  checkCancelled(cancellationToken);
  if (info.error) throw new Error(info.error);
  if (!configuration) throw new Error("No configuration found for vector search");
  // get embedder
  const { embedder } = await resolveLanguageModel(info.provider);
  if (!embedder) throw new Error(`${info.provider} does not support embeddings`);

  const cachedEmbedder = createCachedEmbedder(embedder);
  // Pull the model
  await runtimeHost.pullModel(configuration, { trace, cancellationToken });
  checkCancelled(cancellationToken);

  if (!options.vectorSize) {
    const sniff = await cachedEmbedder(
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
      configuration,
      options,
    );
    options.vectorSize = sniff.data[0].length;
  }

  return await factory(indexName, configuration, cachedEmbedder, options);
}

/**
 * Indexes a set of files into a vector index using embeddings.
 * @param indexName The name of the index to create or update. Defaults to "default" if not provided.
 * @param files The list of files to index. Their content will be resolved before indexing.
 * @param options Configuration options, including embeddings model, cancellation token, tracing, and other runtime settings.
 */
export async function vectorIndex(
  indexName: string,
  files: WorkspaceFile[],
  options: VectorSearchOptions & TraceOptions & CancellationOptions,
): Promise<void> {
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
    checkCancelled(cancellationToken);
    for (const file of files) {
      await resolveFileContent(file, { trace });
      checkCancelled(cancellationToken);
      await index.insertOrUpdate(file);
      checkCancelled(cancellationToken);
    }
  } finally {
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
export async function vectorSearch(
  indexName: string,
  query: string,
  files: WorkspaceFile[],
  options: VectorSearchOptions & TraceOptions & CancellationOptions,
): Promise<WorkspaceFileWithScore[]> {
  indexName = indexName || "default";
  const { topK, embeddingsModel, minScore = 0, cancellationToken, trace } = options;

  trace?.startDetails(`🔍 embeddings: searching`);
  try {
    trace?.itemValue(`name`, indexName);
    trace?.itemValue(`model`, embeddingsModel);
    const index = await vectorCreateIndex(indexName, {
      ...options,
      trace: trace,
    });
    checkCancelled(cancellationToken);
    for (const file of files) {
      await resolveFileContent(file, { trace });
      checkCancelled(cancellationToken);
      await index.insertOrUpdate(file);
      checkCancelled(cancellationToken);
    }
    const r = await index.search(query, { topK, minScore });
    return r;
  } finally {
    trace?.endDetails();
  }
}
