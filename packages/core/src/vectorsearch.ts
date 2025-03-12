/**
 * This module provides functionality for creating embeddings using OpenAI's API
 * and performing vector search on documents.
 */

import { encode, decode } from "gpt-tokenizer"
import { resolveModelConnectionInfo } from "./models"
import { runtimeHost, host } from "./host"
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
import { ellipse, logVerbose } from "./util"
import { TraceOptions } from "./trace"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { arrayify, trimTrailingSlash } from "./cleaners"
import { resolveFileContent } from "./file"

/**
 * Represents the cache key for embeddings.
 * This is used to store and retrieve cached embeddings.
 */
export interface EmbeddingsCacheKey {
    base: string
    provider: string
    model: string
    inputs: string | string[]
}

/**
 * Type alias for the embeddings cache.
 * Maps cache keys to embedding responses.
 */
export type EmbeddingsCache = JSONLineCache<
    EmbeddingsCacheKey,
    EmbeddingsResponse
>

/**
 * Class for creating embeddings using the OpenAI API.
 * Implements the EmbeddingsModel interface.
 */
class OpenAIEmbeddings implements EmbeddingsModel {
    readonly cache: JSONLineCache<EmbeddingsCacheKey, EmbeddingsResponse>

    /**
     * Constructs an instance of OpenAIEmbeddings.
     * @param info Connection options for the model.
     * @param configuration Configuration for the language model.
     * @param options Options for tracing.
     */
    public constructor(
        readonly info: ModelConnectionOptions,
        readonly configuration: LanguageModelConfiguration,
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
        const { provider, base, model } = this.configuration

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
        const { provider, base, model, type } = this.configuration
        const { trace } = this.options || {}
        const body: EmbeddingCreateParams = { input, model }
        let url: string
        const headers: Record<string, string> = getConfigHeaders(
            this.configuration
        )
        headers["Content-Type"] = "application/json"

        // Determine the URL based on provider type
        if (
            provider === MODEL_PROVIDER_AZURE_OPENAI ||
            provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI ||
            type === "azure" ||
            type === "azure_serverless"
        ) {
            url = `${trimTrailingSlash(base)}/${model.replace(/\./g, "")}/embeddings?api-version=${AZURE_OPENAI_API_VERSION}`
            delete body.model
        } else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
            url = base.replace(/^https?:\/\/([^/]+)\/?/, body.model)
            delete body.model
        } else {
            url = `${base}/embeddings`
        }
        const fetch = await createFetch({ retryOn: [429] })
        if (trace) traceFetchPost(trace, url, headers, body)
        logVerbose(
            `embeddings: ${ellipse(typeof input === "string" ? input : input?.join(","), 32)} with ${provider}:${model}`
        )

        // Send POST request to create embeddings
        checkCancelled(this.options?.cancellationToken)
        const resp = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        })
        trace?.itemValue(`response`, `${resp.status} ${resp.statusText}`)

        // Process the response
        if (resp.status < 300) {
            const data = (await resp.json()) as EmbeddingCreateResponse
            return {
                status: "success",
                output: data.data
                    .sort((a, b) => a.index - b.index)
                    .map((item) => item.embedding),
            }
        } else if (resp.status == 429) {
            return {
                status: "rate_limited",
                message: `The embeddings API returned a rate limit error.`,
            }
        } else {
            return {
                status: "error",
                message: `The embeddings API returned an error status of ${resp.status}: ${resp.statusText}`,
            }
        }
    }
}

/**
 * Create a vector index for documents.
 */
export async function vectorIndex(
    folderPath: string,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
): Promise<WorkspaceFileIndex> {
    const {
        embeddingsModel,
        version = 1,
        deleteIfExists,
        trace,
        cancellationToken,
        chunkSize = 512,
        chunkOverlap = 128,
    } = options || {}

    // Import the local document index
    const { LocalDocumentIndex } = await import("vectra")
    const tokenizer = { encode, decode }

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

    // Pull the model
    await runtimeHost.pullModel(configuration, { trace, cancellationToken })
    checkCancelled(cancellationToken)
    const embeddings = new OpenAIEmbeddings(info, configuration, {
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
        list: async () => {
            const docs = await index.listDocuments()
            const res: WorkspaceFile[] = []
            for (const doc of docs) {
                res.push({
                    filename: doc.uri,
                    content: await doc.loadText(),
                })
            }
            return res
        },
        upsert: async (file) => {
            const files = arrayify(file)
            for (const f of files) {
                await resolveFileContent(f, { trace })
                if (f.content && !f.encoding)
                    await index.upsertDocument(f.filename, f.content)
            }
        },
        query: async (query, options) => {
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

/**
 * Performs a vector search on documents based on a query.
 * @param query The search query.
 * @param files The files to search within.
 * @param options Options for vector search, including folder path and tracing.
 * @returns The files with scores based on relevance to the query.
 */
export async function vectorSearch(
    query: string,
    files: WorkspaceFile[],
    folderPath: string,
    options: VectorSearchOptions & TraceOptions & CancellationOptions
): Promise<WorkspaceFileWithScore[]> {
    const {
        topK,
        embeddingsModel,
        minScore = 0,
        trace,
        cancellationToken,
    } = options

    trace?.startDetails(`🔍 embeddings`)
    try {
        trace?.itemValue(`model`, embeddingsModel)
        const index = await vectorIndex(folderPath, options)
        checkCancelled(cancellationToken)
        for (const file of files) {
            await index.upsert(file)
            checkCancelled(cancellationToken)
        }
        const r = await index.query(query, { topK, minScore })
        return r
    } finally {
        trace?.endDetails()
    }
}
