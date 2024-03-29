import {
    Host,
    LLAMAINDEX_MIN_SCORE,
    LLAMAINDEX_SIMILARITY_TOPK,
    MarkdownTrace,
    PromiseType,
    RETRIEVAL_DEFAULT_INDEX,
    RETRIEVAL_DEFAULT_MODEL,
    ResponseStatus,
    RetreivalOptions,
    RetreivalSearchOptions,
    RetreivalSearchResponse,
    RetreivalService,
    RetreivalUpsertOptions,
    dotGenaiscriptPath,
    fileExists,
    installImport,
    lookupMime,
    serializeError,
    createFetch,
} from "genaiscript-core"
import type { BaseReader, NodeWithScore, Metadata } from "llamaindex"
import type { GenericFileSystem } from "@llamaindex/env"
import { fileTypeFromBuffer } from "file-type"
import { LLAMAINDEX_VERSION } from "./version"

class BlobFileSystem implements GenericFileSystem {
    constructor(
        readonly filename: string,
        readonly blob: Blob
    ) { }
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

export class LlamaIndexRetreivalService implements RetreivalService {
    private module: PromiseType<ReturnType<typeof tryImportLlamaIndex>>
    private READERS: Record<string, BaseReader>

    constructor(readonly host: Host) { }

    async init(trace?: MarkdownTrace) {
        if (this.module) return

        this.module = await tryImportLlamaIndex(trace)
        this.READERS = {
            "text/plain": new this.module.TextFileReader(),
            "application/javascript": new this.module.TextFileReader(),
            "application/json": new this.module.TextFileReader(),
            "application/pdf": new this.module.PDFReader(),
            "text/markdown": new this.module.MarkdownReader(),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                new this.module.DocxReader(),
            "text/html": new this.module.HTMLReader(),
            "text/csv": new this.module.PapaCSVReader(),
        }
    }

    private getPersisDir(indexName: string, summary: boolean) {
        const persistDir = this.host.path.join(
            dotGenaiscriptPath("retreival"),
            summary ? "summary" : "full",
            indexName
        )
        return persistDir
    }

    private async createStorageContext(options?: {
        files?: string[]
        indexName?: string
        summary?: boolean
    }) {
        const {
            files,
            indexName = RETRIEVAL_DEFAULT_INDEX,
            summary,
        } = options ?? {}
        const { storageContextFromDefaults, SimpleVectorStore } = this.module
        const persistDir = this.getPersisDir(indexName, summary)
        await this.host.createDirectory(persistDir)
        const storageContext = await storageContextFromDefaults({
            persistDir,
            vectorStore: summary ? new SimpleVectorStore() : undefined,
        })
        if (files?.length && !summary) {
            // get all documents
            const docs = await storageContext.docStore.getAllRefDocInfo()
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
        return { storageContext, persistDir }
    }

    private async createServiceContext(options?: {
        model?: string
        temperature?: number
        chunkSize?: number
        chunkOverlap?: number
        splitLongSentences?: boolean
    }) {
        const {
            model = RETRIEVAL_DEFAULT_MODEL,
            temperature,
            splitLongSentences = true,
            ...rest
        } = options ?? {}
        const { SimpleNodeParser, serviceContextFromDefaults, OpenAI } =
            this.module
        const serviceContext = serviceContextFromDefaults({
            llm: new OpenAI({ model, temperature }),
            nodeParser: new SimpleNodeParser({
                ...rest,
                splitLongSentences,
            }),
        })
        return serviceContext
    }

    async clear(options?: RetreivalOptions) {
        const { indexName = RETRIEVAL_DEFAULT_INDEX, summary } = options || {}
        const persistDir = this.getPersisDir(indexName, summary)
        await this.host.deleteDirectory(persistDir)
        return { ok: true }
    }

    async upsert(
        filenameOrUrl: string,
        options?: RetreivalUpsertOptions
    ): Promise<ResponseStatus> {
        const { Document, VectorStoreIndex, SummaryIndex } = this.module
        const { content, mimeType, summary } = options ?? {}
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
        if (!reader)
            return {
                ok: false,
                error: serializeError(new Error(`no reader for content type '${type}'`)),
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
        const serviceContext = await this.createServiceContext(options)
        const { storageContext, persistDir } =
            await this.createStorageContext(options)
        await storageContext.docStore.addDocuments(documents, true)
        if (summary) {
            if (
                !(await fileExists(
                    this.host.path.join(persistDir, "doc_store.json")
                ))
            )
                await SummaryIndex.fromDocuments(documents, {
                    storageContext,
                    serviceContext,
                })
            else {
                await SummaryIndex.init({
                    storageContext,
                    serviceContext,
                })
            }
        } else
            await VectorStoreIndex.fromDocuments(documents, {
                storageContext,
                serviceContext,
            })
        return { ok: true }
    }

    async search(
        text: string,
        options?: RetreivalSearchOptions
    ): Promise<RetreivalSearchResponse> {
        const {
            topK = LLAMAINDEX_SIMILARITY_TOPK,
            minScore = LLAMAINDEX_MIN_SCORE,
            summary,
        } = options ?? {}
        const {
            VectorStoreIndex,
            MetadataMode,
            SummaryIndex,
            SimilarityPostprocessor,
            SummaryRetrieverMode,
        } = this.module

        const serviceContext = await this.createServiceContext()
        const { storageContext } = await this.createStorageContext(options)
        let results: NodeWithScore<Metadata>[]
        if (summary) {
            const index = await SummaryIndex.init({
                storageContext,
                serviceContext,
            })
            const retreiver = index.asRetriever({
                mode: SummaryRetrieverMode.LLM,
            })
            results = await retreiver.retrieve(text)
        } else {
            const index = await VectorStoreIndex.init({
                storageContext,
                serviceContext,
            })
            const retreiver = index.asRetriever({
                similarityTopK: topK,
            })
            results = await retreiver.retrieve(text)
        }

        const processor = new SimilarityPostprocessor({
            similarityCutoff: minScore,
        })
        const postResults = await processor.postprocessNodes(results)

        return {
            ok: true,
            results: postResults.map((r) => ({
                filename: r.node.metadata.filename,
                id: r.node.id_,
                text: r.node.getContent(MetadataMode.NONE),
                score: r.score,
            })),
        }
    }

    /**
     * Returns all embeddings
     * @returns
     */
    async embeddings(
        options?: RetreivalOptions
    ): Promise<RetreivalSearchResponse> {
        const { MetadataMode } = this.module
        const { storageContext } = await this.createStorageContext(options)
        const docs = await storageContext.docStore.docs()
        return {
            ok: true,
            results: Object.values(docs).map((r) => ({
                filename: r.metadata.filename,
                id: r.id_,
                text: r.getContent(MetadataMode.NONE),
            })),
        }
    }
}
