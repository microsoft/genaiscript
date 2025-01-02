/**
 * This module provides functionality for creating embeddings using OpenAI's API
 * and performing vector search on documents.
 */

import { encode, decode } from "gpt-tokenizer"
import { resolveModelConnectionInfo } from "./models"
import { runtimeHost, host } from "./host"
import {
    AZURE_OPENAI_API_VERSION,
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
import { logVerbose, trimTrailingSlash } from "./util"
import { TraceOptions } from "./trace"

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
        readonly options?: TraceOptions
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
        logVerbose(`embedding ${model}`)

        // Send POST request to create embeddings
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
 * Performs a vector search on documents based on a query.
 * @param query The search query.
 * @param files The files to search within.
 * @param options Options for vector search, including folder path and tracing.
 * @returns The files with scores based on relevance to the query.
 */
export async function vectorSearch(
    query: string,
    files: WorkspaceFile[],
    options: VectorSearchOptions & { folderPath: string } & TraceOptions
): Promise<WorkspaceFileWithScore[]> {
    const {
        topK,
        folderPath,
        embeddingsModel = runtimeHost.modelAliases.embeddings.model,
        minScore = 0,
        trace,
    } = options

    trace?.startDetails(`🔍 embeddings`)
    try {
        trace?.itemValue(`model`, embeddingsModel)

        // Import the local document index
        const { LocalDocumentIndex } = await import(
            "vectra/lib/LocalDocumentIndex"
        )
        const tokenizer = { encode, decode }

        // Resolve connection info for the embeddings model
        const { info, configuration } = await resolveModelConnectionInfo(
            {
                model: embeddingsModel,
            },
            {
                token: true,
            }
        )
        if (info.error) throw new Error(info.error)
        if (!configuration)
            throw new Error("No configuration found for vector search")

        // Pull the model
        await runtimeHost.pullModel(info.model, { trace })
        const embeddings = new OpenAIEmbeddings(info, configuration, { trace })

        // Create a local document index
        const index = new LocalDocumentIndex({
            tokenizer,
            folderPath,
            embeddings,
            chunkingConfig: {
                chunkSize: 512,
                chunkOverlap: 128,
                tokenizer,
            },
        })
        await index.createIndex({ version: 1, deleteIfExists: true })

        // Insert documents into the index
        for (const file of files) {
            const { filename, content } = file
            await index.upsertDocument(filename, content)
        }

        // Query documents based on the search query
        const res = await index.queryDocuments(query, { maxDocuments: topK })
        const r: WorkspaceFileWithScore[] = []

        // Filter and return results that meet the minScore
        for (const re of res.filter((re) => re.score >= minScore)) {
            r.push(<WorkspaceFileWithScore>{
                filename: re.uri,
                content: (await re.renderAllSections(8000))
                    .map((s) => s.text)
                    .join("\n...\n"),
                score: re.score,
            })
        }
        return r
    } finally {
        trace?.endDetails()
    }
}
