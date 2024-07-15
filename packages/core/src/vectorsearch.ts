import { encode, decode } from "gpt-tokenizer"
import { resolveModelConnectionInfo } from "./models"
import {
    AZURE_OPENAI_API_VERSION,
    DEFAULT_EMBEDDINGS_MODEL,
    MODEL_PROVIDER_AZURE,
} from "./constants"
import type { EmbeddingsModel, EmbeddingsResponse } from "vectra/lib/types"
import { createFetch, traceFetchPost } from "./fetch"
import { JSONLineCache } from "./cache"
import { EmbeddingCreateParams, EmbeddingCreateResponse } from "./chat"
import { LanguageModelConfiguration } from "./host"
import { getConfigHeaders } from "./openai"
import { dotGenaiscriptPath, trimTrailingSlash } from "./util"
import { MarkdownTrace, TraceOptions } from "./trace"

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
        readonly trace?: MarkdownTrace
    ) {
        this.cache = JSONLineCache.byName<
            EmbeddingsCacheKey,
            EmbeddingsResponse
        >(dotGenaiscriptPath("cache", "embeddings"))
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
            url = `${base}/v1/embeddings`
        }
        const fetch = await createFetch({ retryOn: [429] })
        const resp = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        })

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
        model = DEFAULT_EMBEDDINGS_MODEL,
        minScore = 0,
        trace,
    } = options
    const { LocalDocumentIndex } = await import("vectra/lib/LocalDocumentIndex")

    const tokenizer = { encode, decode }
    const { info, configuration } = await resolveModelConnectionInfo({
        model,
    })
    if (info.error) throw new Error(info.error)
    const embeddings = new OpenAIEmbeddings(info, configuration, trace)
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
    for (const re of res) {
        r.push(<WorkspaceFileWithScore>{
            filename: re.uri,
            content: (await re.renderAllSections(8000))
                .map((s) => s.text)
                .join("\n...\n"),
            score: re.score,
        })
    }
    return r.filter((_) => _.score >= minScore)
}
