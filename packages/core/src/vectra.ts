/**
 * This module provides functionality for creating embeddings using OpenAI's API
 * and performing vector search on documents.
 */

import { encode, decode } from "gpt-tokenizer"
import { resolveModelConnectionInfo } from "./models"
import { runtimeHost } from "./host"
import {
    AZURE_OPENAI_API_VERSION,
    EMBEDDINGS_MODEL_ID,
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
} from "./constants"
import type { EmbeddingsModel, EmbeddingsResponse } from "vectra/lib/types"
import { createFetch, traceFetchPost } from "./fetch"
import { JSONLineCache } from "./cache"
import { EmbeddingCreateParams, EmbeddingCreateResponse } from "./chattypes"
import { LanguageModelConfiguration } from "./server/messages"
import { getConfigHeaders } from "./openai"
import { dotGenaiscriptPath, ellipse, logVerbose } from "./util"
import { TraceOptions } from "./trace"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { arrayify, trimTrailingSlash } from "./cleaners"
import { resolveFileContent } from "./file"
import { EmbeddingFunction, WorkspaceFileIndexCreator } from "./chat"

/**
 * Represents the cache key for embeddings.
 * This is used to store and retrieve cached embeddings.
 */
interface EmbeddingsCacheKey {
    base: string
    provider: string
    model: string
    inputs: string | string[]
}

/**
 * Type alias for the embeddings cache.
 * Maps cache keys to embedding responses.
 */
type EmbeddingsCache = JSONLineCache<EmbeddingsCacheKey, EmbeddingsResponse>

/**
 * Class for creating embeddings using the OpenAI API.
 * Implements the EmbeddingsModel interface.
 */
class OpenAIEmbeddings implements EmbeddingsModel {
    readonly cache: EmbeddingsCache

    /**
     * Constructs an instance of OpenAIEmbeddings.
     * @param info Connection options for the model.
     * @param configuration Configuration for the language model.
     * @param options Options for tracing.
     */
    public constructor(
        readonly cfg: LanguageModelConfiguration,
        readonly embedder: EmbeddingFunction,
        readonly options?: TraceOptions & CancellationOptions
    ) {
        this.cache = JSONLineCache.byName<
            EmbeddingsCacheKey,
            EmbeddingsResponse
        >("embeddings")
    }

    // Maximum number of tokens for embeddings
    maxTokens = 512

    /**
     * Creates embeddings for the given inputs using the OpenAI API.
     * @param inputs Text inputs to create embeddings for.
     * @returns A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.
     */
    public async createEmbeddings(
        inputs: string | string[]
    ): Promise<EmbeddingsResponse> {
        const { provider, base, model } = this.cfg

        // Define the cache key for the current request
        const cacheKey: EmbeddingsCacheKey = { inputs, model, provider, base }

        // Check if the result is already cached
        const cached = await this.cache.get(cacheKey)
        if (cached) return cached

        checkCancelled(this.options?.cancellationToken)
        // Create embeddings if not cached
        const res = await this.uncachedCreateEmbeddings(inputs)
        if (res.status === "success") this.cache.set(cacheKey, res)

        return res
    }

    /**
     * Creates embeddings without using the cache.
     * @param input The input text or texts.
     * @returns The response containing the embeddings or error information.
     */
    private async uncachedCreateEmbeddings(
        input: string | string[]
    ): Promise<EmbeddingsResponse> {
        const { error, data } = await this.embedder(
            arrayify(input)[0],
            this.cfg,
            this.options
        )
        if (error) return { status: "error", message: error }
        return {
            status: "success",
            output: data,
        }
    }
}

/**
 * Create a vector index for documents.
 */
export const vectraWorkspaceFileIndex: WorkspaceFileIndexCreator = async (
    indexName: string,
    cfg: LanguageModelConfiguration,
    embedder: EmbeddingFunction,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
) => {
    const {
        version = 1,
        deleteIfExists,
        trace,
        cancellationToken,
        chunkSize = 512,
        chunkOverlap = 128,
    } = options || {}

    indexName = indexName?.replace(/[^a-z0-9]/i, "") || "default"
    const folderPath = dotGenaiscriptPath("vectors", indexName)

    // Import the local document index
    const { LocalDocumentIndex } = await import("vectra")
    const tokenizer = { encode, decode }

    const embeddings = new OpenAIEmbeddings(cfg, embedder, {
        trace,
        cancellationToken,
    })

    // Create a local document index
    const index = new LocalDocumentIndex({
        tokenizer,
        folderPath,
        embeddings,
        chunkingConfig: {
            chunkSize,
            chunkOverlap,
            tokenizer,
        },
    })
    if (!(await index.isIndexCreated()))
        await index.createIndex({ version, deleteIfExists })
    checkCancelled(cancellationToken)

    return Object.freeze({
        name: indexName,
        insertOrUpdate: async (file) => {
            const files = arrayify(file)
            for (const f of files) {
                await resolveFileContent(f, { trace })
                if (f.content && !f.encoding)
                    await index.upsertDocument(f.filename, f.content)
            }
        },
        search: async (query, options) => {
            const { topK, minScore = 0 } = options || {}
            const docs = (
                await index.queryDocuments(query, { maxDocuments: topK })
            ).filter((r) => r.score >= minScore)
            const res: WorkspaceFileWithScore[] = []
            for (const doc of docs) {
                res.push(<WorkspaceFileWithScore>{
                    filename: doc.uri,
                    content: (await doc.renderAllSections(8000))
                        .map((s) => s.text)
                        .join("\n...\n"),
                    score: doc.score,
                })
            }
            return res
        },
    } satisfies WorkspaceFileIndex)
}
