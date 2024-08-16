import { encode, decode } from "gpt-tokenizer"
import { resolveModelConnectionInfo } from "./models"
import { runtimeHost } from "./host"
import { AZURE_OPENAI_API_VERSION, MODEL_PROVIDER_AZURE } from "./constants"
import type { EmbeddingsModel, EmbeddingsResponse } from "vectra/lib/types"
import { createFetch, traceFetchPost } from "./fetch"
import { JSONLineCache } from "./cache"
import { EmbeddingCreateParams, EmbeddingCreateResponse } from "./chattypes"
import { LanguageModelConfiguration } from "./host"
import { getConfigHeaders } from "./openai"
import { logVerbose, trimTrailingSlash } from "./util"
import { TraceOptions } from "./trace"

export interface EmbeddingsCacheKey {
    base: string
    provider: string
    model: string
    inputs: string | string[]
}
export type EmbeddingsCache = JSONLineCache<
    EmbeddingsCacheKey,
    EmbeddingsResponse
>

class OpenAIEmbeddings implements EmbeddingsModel {
    readonly cache: JSONLineCache<EmbeddingsCacheKey, EmbeddingsResponse>
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

    maxTokens = 512

    /**
     * Creates embeddings for the given inputs using the OpenAI API.
     * @param model Name of the model to use (or deployment for Azure).
     * @param inputs Text inputs to create embeddings for.
     * @returns A `EmbeddingsResponse` with a status and the generated embeddings or a message when an error occurs.
     */
    public async createEmbeddings(
        inputs: string | string[]
    ): Promise<EmbeddingsResponse> {
        const { provider, base, model } = this.configuration

        const cacheKey: EmbeddingsCacheKey = { inputs, model, provider, base }
        const cached = await this.cache.get(cacheKey)
        if (cached) return cached

        const res = await this.uncachedCreateEmbeddings(inputs)
        if (res.status === "success") this.cache.set(cacheKey, res)

        return res
    }
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
        if (provider === MODEL_PROVIDER_AZURE || type === "azure") {
            url = `${trimTrailingSlash(base)}/${model.replace(/\./g, "")}/embeddings?api-version=${AZURE_OPENAI_API_VERSION}`
            delete body.model
        } else {
            url = `${base}/embeddings`
        }
        const fetch = await createFetch({ retryOn: [429] })
        if (trace) traceFetchPost(trace, url, headers, body)
        logVerbose(`embedding ${model}`)
        const resp = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        })
        trace?.itemValue(`response`, `${resp.status} ${resp.statusText}`)

        // Process response
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

export async function vectorSearch(
    query: string,
    files: WorkspaceFile[],
    options: VectorSearchOptions & { folderPath: string } & TraceOptions
): Promise<WorkspaceFileWithScore[]> {
    const {
        topK,
        folderPath,
        embeddingsModel = runtimeHost.defaultEmbeddingsModelOptions
            .embeddingsModel,
        minScore = 0,
        trace,
    } = options

    trace?.startDetails(`🔍 embeddings`)
    try {
        trace?.itemValue(`model`, embeddingsModel)
        const { LocalDocumentIndex } = await import(
            "vectra/lib/LocalDocumentIndex"
        )
        const tokenizer = { encode, decode }
        const { info, configuration } = await resolveModelConnectionInfo({
            model: embeddingsModel,
        })
        if (info.error) throw new Error(info.error)
        if (!configuration)
            throw new Error("No configuration found for vector search")
        await runtimeHost.models.pullModel(info.model)
        const embeddings = new OpenAIEmbeddings(info, configuration, { trace })
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
        for (const file of files) {
            const { filename, content } = file
            await index.upsertDocument(filename, content)
        }
        const res = await index.queryDocuments(query, { maxDocuments: topK })
        const r: WorkspaceFileWithScore[] = []
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
