import {
    Host,
    MarkdownTrace,
    ResponseStatus,
    RetreivalService,
    dotGenaiscriptPath,
    installImport,
    writeText,
} from "genaiscript-core"
import type { BaseReader, GenericFileSystem } from "llamaindex"

type PromiseType<T extends Promise<any>> =
    T extends Promise<infer U> ? U : never

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
        trace?.error("llamaindex not found, installing...")
        await installImport("llamaindex", trace)
        const m = await import("llamaindex")
        return m
    }
}

export class LlamaIndexRetreivalService implements RetreivalService {
    private module: PromiseType<ReturnType<typeof tryImportLlamaIndex>>
    private READERS: Record<string, BaseReader>

    constructor(readonly host: Host) {}

    async init(trace?: MarkdownTrace) {
        if (this.module) return

        this.module = await tryImportLlamaIndex(trace)
        this.READERS = {
            "text/plain": new this.module.TextFileReader(),
            "application/javascript": new this.module.TextFileReader(),
            "application/pdf": new this.module.PDFReader(),
            "text/markdown": new this.module.MarkdownReader(),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                new this.module.DocxReader(),
            "text/html": new this.module.HTMLReader(),
            "text/csv": new this.module.PapaCSVReader(),
        }
    }

    private async createStorageContext() {
        const { storageContextFromDefaults } = this.module
        const persistDir = dotGenaiscriptPath("retreival")
        await this.host.createDirectory(persistDir)
        await writeText(
            this.host.path.join(persistDir, ".gitignore"),
            "*.json -diff merge=ours linguist-generated"
        )
        const storageContext = await storageContextFromDefaults({
            persistDir,
        })
        return storageContext
    }

    private async createServiceContext() {
        const { serviceContextFromDefaults, OpenAI } = this.module
        const serviceContext = serviceContextFromDefaults({
            llm: new OpenAI({}),
        })
        return serviceContext
    }

    async clear() {
        const persistDir = dotGenaiscriptPath("retreival")
        await this.host.deleteDirectory(persistDir)
        return { ok: true }
    }

    async upsert(
        filenameOrUrl: string,
        content: Blob
    ): Promise<ResponseStatus> {
        const { Document, VectorStoreIndex } = this.module
        const { type } = content
        const reader = this.READERS[content.type]
        if (!reader)
            return {
                ok: false,
                error: `no reader for content type ${type}`,
            }
        const storageContext = await this.createStorageContext()
        const serviceContext = await this.createServiceContext()
        const fs = new BlobFileSystem(filenameOrUrl, content)
        const documents = (await reader.loadData(filenameOrUrl, fs)).map(
            (doc) =>
                new Document({
                    text: doc.text,
                    metadata: { filename: filenameOrUrl },
                })
        )
        await storageContext.docStore.addDocuments(documents, true)
        await VectorStoreIndex.fromDocuments(documents, {
            storageContext,
            serviceContext,
            logProgress: true,
        })
        await storageContext.docStore.persist()
        return { ok: true }
    }

    async query(text: string): Promise<
        ResponseStatus & {
            response: string
        }
    > {
        const { VectorStoreIndex, MetadataMode } = this.module

        const storageContext = await this.createStorageContext()
        const serviceContext = await this.createServiceContext()
        const index = await VectorStoreIndex.init({
            storageContext,
            serviceContext,
        })
        const retreiver = index.asQueryEngine()
        const results = await retreiver.query({
            query: text,
            stream: false,
        })
        return {
            ok: true,
            response: results.response,
        }
    }

    async search(text: string): Promise<
        ResponseStatus & {
            results: {
                filename: string
                id: string
                text: string
                score: number
            }[]
        }
    > {
        const { VectorStoreIndex, MetadataMode } = this.module

        const storageContext = await this.createStorageContext()
        const serviceContext = await this.createServiceContext()
        const index = await VectorStoreIndex.init({
            storageContext,
            serviceContext,
        })
        const retreiver = index.asRetriever()
        const results = await retreiver.retrieve(text)
        return {
            ok: true,
            results: results.map((r) => ({
                filename: r.node.metadata.filename,
                id: r.node.id_,
                text: r.node.getContent(MetadataMode.NONE),
                score: r.score,
            })),
        }
    }
}
