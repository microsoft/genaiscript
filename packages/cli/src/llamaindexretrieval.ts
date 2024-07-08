import { type BaseReader } from "llamaindex"
import type { GenericFileSystem } from "@llamaindex/env"
import { fileTypeFromBuffer } from "file-type"
import { LLAMAINDEX_VERSION } from "./version"
import assert from "assert"
import { ensureDir, writeJSON } from "fs-extra"
import {
    JAVASCRIPT_MIME_TYPE,
    JSON_MIME_TYPE,
    JSON_SCHEMA_MIME_TYPE,
    PDF_MIME_TYPE,
    DOCX_MIME_TYPE,
    RETRIEVAL_PERSIST_DIR,
    RETRIEVAL_DEFAULT_INDEX,
    MODEL_PROVIDER_OLLAMA,
    TOOL_ID,
    RETRIEVAL_DEFAULT_LLM_MODEL,
    RETRIEVAL_DEFAULT_EMBED_MODEL,
    RETRIEVAL_DEFAULT_TEMPERATURE,
    LLAMAINDEX_SIMILARITY_TOPK,
    LLAMAINDEX_MIN_SCORE,
} from "../../core/src/constants"
import { createFetch } from "../../core/src/fetch"
import { tryReadJSON } from "../../core/src/fs"
import {
    RetrievalService,
    ModelService,
    Host,
    ResponseStatus,
    RetrievalUpsertOptions,
    RetrievalSearchOptions,
    RetrievalSearchResponse,
} from "../../core/src/host"
import { installImport, PromiseType } from "../../core/src/import"
import { lookupMime } from "../../core/src/mime"
import { parseModelIdentifier } from "../../core/src/models"
import { MarkdownTrace } from "../../core/src/trace"
import { dotGenaiscriptPath } from "../../core/src/util"

class BlobFileSystem implements GenericFileSystem {
    constructor(
        readonly filename: string,
        readonly blob: Blob
    ) {}
    writeFile(path: string, content: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    async readRawFile(path: string): Promise<Buffer> {
        if (path !== this.filename) throw new Error("Trying to read wrong file")
        return Buffer.from(await this.blob.arrayBuffer())
    }
    async readFile(path: string): Promise<string> {
        if (path !== this.filename) throw new Error("Trying to read wrong file")
        return await this.blob.text()
    }
    access(path: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    mkdir(path: string, options: { recursive: boolean }): Promise<string>
    mkdir(path: string): Promise<void>
    mkdir(path: unknown, options?: unknown): Promise<void> | Promise<string> {
        throw new Error("Method not implemented.")
    }
}

async function tryImportLlamaIndex(trace: MarkdownTrace) {
    try {
        const m = await import("llamaindex")
        return m
    } catch (e) {
        trace?.error(
            `llamaindex not found, installing ${LLAMAINDEX_VERSION}...`
        )
        await installImport("llamaindex", LLAMAINDEX_VERSION, trace)
        const m = await import("llamaindex")
        return m
    }
}

export class LlamaIndexRetrievalService
    implements RetrievalService, ModelService
{
    private module: PromiseType<ReturnType<typeof tryImportLlamaIndex>>
    private READERS: Record<string, BaseReader>

    constructor(readonly host: Host) {}

    async init(trace?: MarkdownTrace) {
        if (this.module) return

        this.module = await tryImportLlamaIndex(trace)
        this.READERS = {
            "text/plain": new this.module.TextFileReader(),
            [JAVASCRIPT_MIME_TYPE]: new this.module.TextFileReader(),
            [JSON_MIME_TYPE]: new this.module.TextFileReader(),
            [JSON_SCHEMA_MIME_TYPE]: new this.module.TextFileReader(),
            [PDF_MIME_TYPE]: new this.module.PDFReader(),
            "text/markdown": new this.module.MarkdownReader(),
            [DOCX_MIME_TYPE]: new this.module.DocxReader(),
            "text/html": new this.module.HTMLReader(),
            "text/csv": new this.module.PapaCSVReader(),
        }
    }

    private getPersisDir(indexName: string) {
        const persistDir = this.host.path.join(
            dotGenaiscriptPath(RETRIEVAL_PERSIST_DIR),
            "vectors",
            indexName
        )
        return persistDir
    }

    private async createStorageContext(options?: {
        files?: string[]
        indexName?: string
    }) {
        const { files, indexName = RETRIEVAL_DEFAULT_INDEX } = options ?? {}
        const { storageContextFromDefaults, SimpleVectorStore } = this.module
        const persistDir = this.getPersisDir(indexName)
        await this.host.createDirectory(persistDir)
        const storageContext = await storageContextFromDefaults({
            persistDir,
        })
        if (files?.length) {
            // get all documents
            const docs = await storageContext.docStore.getAllRefDocInfo()
            if (docs) {
                // reload vector store
                const vectorStore = await SimpleVectorStore.fromDict(
                    await (
                        await SimpleVectorStore.fromPersistDir(persistDir)
                    ).toDict()
                )
                // remove uneeded documents
                const toRemove = Object.keys(docs).filter(
                    (id) => !files.includes(id)
                )
                for (const doc of toRemove) vectorStore.delete(doc)
                // swap in storateContext
                storageContext.vectorStore = vectorStore
            }
        }
        return { storageContext, persistDir }
    }

    private async getModelToken(modelId: string) {
        assert(!!modelId)
        const { provider } = parseModelIdentifier(modelId)
        const conn = await this.host.getLanguageModelConfiguration(modelId)
        if (provider === MODEL_PROVIDER_OLLAMA)
            conn.base = conn.base.replace(/\/v1$/i, "")
        return conn
    }

    async pullModel(modelid: string): Promise<ResponseStatus> {
        assert(!!modelid)
        const { provider, model } = parseModelIdentifier(modelid)
        const conn = await this.getModelToken(modelid)
        if (provider === MODEL_PROVIDER_OLLAMA) {
            const res = await fetch(`${conn.base}/api/pull`, {
                method: "POST",
                headers: {
                    "user-agent": TOOL_ID,
                    "content-type": "application/json",
                },
                body: JSON.stringify({ name: model, stream: false }, null, 2),
            })
            if (res.ok) {
                const resp = await res.json()
            }
            return { ok: res.ok, status: res.status }
        }

        return { ok: true }
    }

    private async createServiceContext(
        options?: VectorSearchEmbeddingsOptions
    ) {
        const {
            llmModel: llmModel_ = RETRIEVAL_DEFAULT_LLM_MODEL,
            embedModel: embedModel_ = RETRIEVAL_DEFAULT_EMBED_MODEL,
            temperature = RETRIEVAL_DEFAULT_TEMPERATURE,
            ...rest
        } = options ?? {}
        const splitLongSentences = true
        const {
            SimpleNodeParser,
            serviceContextFromDefaults,
            OpenAIEmbedding,
            Ollama,
            OpenAI,
            OllamaEmbedding,
        } = this.module
        const { provider: llmProvider, model: llmModel } =
            parseModelIdentifier(llmModel_)
        const llmToken = await this.getModelToken(llmModel_)
        const { provider: embedProvider, model: embedModel } =
            parseModelIdentifier(embedModel_)
        const embedToken = await this.getModelToken(embedModel_)
        const llmClass = llmProvider === MODEL_PROVIDER_OLLAMA ? Ollama : OpenAI
        const embedClass =
            embedProvider === MODEL_PROVIDER_OLLAMA
                ? OllamaEmbedding
                : OpenAIEmbedding
        const serviceContext = serviceContextFromDefaults({
            llm: llmToken
                ? new llmClass({
                      model: llmModel,
                      temperature,
                      baseURL: llmToken.base,
                      apiKey: llmToken.token,
                  })
                : undefined,
            embedModel: embedToken
                ? new embedClass({
                      model: embedModel,
                      baseURL: embedToken.base,
                      apiKey: embedToken.token,
                      ...rest,
                  })
                : undefined,
            nodeParser: new SimpleNodeParser({
                ...rest,
                splitLongSentences,
            }),
        })
        return serviceContext
    }

    async vectorClear(options?: VectorSearchOptions) {
        const { indexName = RETRIEVAL_DEFAULT_INDEX } = options || {}
        const persistDir = this.getPersisDir(indexName)
        await this.host.deleteDirectory(persistDir)
        return { ok: true }
    }

    private async saveOptions(options: Partial<VectorSearchEmbeddingsOptions>) {
        const {
            llmModel,
            embedModel,
            temperature,
            indexName = RETRIEVAL_DEFAULT_INDEX,
        } = options || {}
        const fn = this.optionsFileName(indexName)
        const current = { llmModel, embedModel, temperature }
        const existing = await tryReadJSON(fn)
        if (existing) {
            if (JSON.stringify(existing) !== JSON.stringify(current))
                throw new Error("model configuration mismatch")
        } else {
            await ensureDir(this.host.path.dirname(fn))
            await writeJSON(fn, { llmModel, embedModel, temperature })
        }
    }

    private async loadOptions(
        options: Partial<VectorSearchEmbeddingsOptions>
    ): Promise<Partial<VectorSearchEmbeddingsOptions>> {
        const {
            llmModel,
            embedModel,
            temperature,
            indexName = RETRIEVAL_DEFAULT_INDEX,
        } = options || {}
        const fn = this.optionsFileName(indexName)
        const current = { llmModel, embedModel, temperature }
        const existing = await tryReadJSON(fn)
        if (!existing) throw new Error("model configuration not found")
        return existing
    }

    private optionsFileName(indexName: string) {
        return this.host.path.join(this.getPersisDir(indexName), "options.json")
    }

    async vectorUpsert(
        filenameOrUrl: string,
        options?: RetrievalUpsertOptions
    ): Promise<ResponseStatus> {
        const { Document, VectorStoreIndex } = this.module
        const { content, mimeType } = options ?? {}
        let blob: Blob = undefined
        if (content) {
            blob = new Blob([content], {
                type: mimeType || "text/plain",
            })
        } else if (/^http?s:\/\//i.test(filenameOrUrl)) {
            const fetch = await createFetch()
            const res = await fetch(filenameOrUrl)
            blob = await res.blob()
        } else {
            const buffer = await this.host.readFile(filenameOrUrl)
            const type =
                (await fileTypeFromBuffer(buffer))?.mime ||
                lookupMime(filenameOrUrl) ||
                undefined
            blob = new Blob([buffer], {
                type,
            })
        }

        const { type } = blob
        //console.debug(`${filenameOrUrl}, ${type}, ${prettyBytes(blob.size)}`)

        const reader =
            this.READERS[type] ||
            (/^text\//.test(type) && this.READERS["text/plain"]) ||
            (!type && this.READERS["text/plain"]) // assume unknown type is text
        if (!reader) {
            throw new Error(`no reader for content type '${type}'`)
        }
        const fs = new BlobFileSystem(filenameOrUrl, blob)
        const documents = (await reader.loadData(filenameOrUrl, fs)).map(
            (doc) =>
                new Document({
                    text: doc.text,
                    id_: filenameOrUrl,
                    metadata: { filename: filenameOrUrl },
                })
        )

        await this.saveOptions(options)

        const serviceContext = await this.createServiceContext(options)
        const { storageContext } = await this.createStorageContext(options)
        await storageContext.docStore.addDocuments(documents, true)
        await VectorStoreIndex.fromDocuments(documents, {
            storageContext,
            serviceContext,
        })
        return { ok: true }
    }

    async vectorSearch(
        text: string,
        options?: RetrievalSearchOptions
    ): Promise<RetrievalSearchResponse> {
        const {
            topK = LLAMAINDEX_SIMILARITY_TOPK,
            minScore = LLAMAINDEX_MIN_SCORE,
        } = options ?? {}
        const { VectorStoreIndex, MetadataMode, SimilarityPostprocessor } =
            this.module

        const indexOptions = await this.loadOptions(options)
        const serviceContext = await this.createServiceContext(indexOptions)
        const { storageContext } = await this.createStorageContext(options)
        const index = await VectorStoreIndex.init({
            storageContext,
            serviceContext,
        })
        const retreiver = index.asRetriever({
            similarityTopK: topK,
        })
        const results = await retreiver.retrieve(text)
        const processor = new SimilarityPostprocessor({
            similarityCutoff: minScore,
        })
        const postResults = await processor.postprocessNodes(results)

        return {
            ok: true,
            results: postResults.map((r) => ({
                filename: r.node.metadata.filename,
                content: r.node.getContent(MetadataMode.NONE),
                score: r.score,
            })),
        }
    }

    /**
     * Returns all embeddings
     * @returns
     */
    async embeddings(
        options?: VectorSearchOptions
    ): Promise<RetrievalSearchResponse> {
        const { MetadataMode } = this.module
        const { storageContext } = await this.createStorageContext(options)
        const docs = await storageContext.docStore.docs()
        return {
            ok: true,
            results: Object.values(docs).map((r) => ({
                filename: r.metadata.filename,
                content: r.getContent(MetadataMode.NONE),
            })),
        }
    }
}
