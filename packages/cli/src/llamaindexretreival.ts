import {
    JSON5TryParse,
    ResponseStatus,
    RetreivalService,
    dotGenaiscriptPath,
} from "genaiscript-core"
import {
    Document,
    MetadataMode,
    storageContextFromDefaults,
    VectorStoreIndex,
    TextFileReader,
    PDFReader,
    MarkdownReader,
    DocxReader,
    HTMLReader,
    BaseReader,
    GenericFileSystem,
} from "llamaindex"

class BlobFileSystem implements GenericFileSystem {
    constructor(readonly blob: Blob) {}
    writeFile(path: string, content: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    async readRawFile(path: string): Promise<Buffer> {
        return Buffer.from(await this.blob.arrayBuffer())
    }
    async readFile(path: string): Promise<string> {
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

const READERS: Record<string, BaseReader> = {
    "text/plain": new TextFileReader(),
    "application/javascript": new TextFileReader(),
    "application/pdf": new PDFReader(),
    "text/markdown": new MarkdownReader(),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        new DocxReader(),
    "text/html": new HTMLReader(),
}

export class LlamaIndexRetreivalService implements RetreivalService {
    private async createStorageContext() {
        const storageContext = await storageContextFromDefaults({
            persistDir: dotGenaiscriptPath("retreival"),
        })
        return storageContext
    }

    async upsert(
        filenameOrUrl: string,
        content: Blob
    ): Promise<ResponseStatus> {
        const { type } = content
        const storageContext = await this.createStorageContext()
        const reader = READERS[content.type]
        if (!reader)
            return {
                ok: false,
                error: `no reader for content type ${type}`,
            }

        const fs = new BlobFileSystem(content)
        const documents = await reader.loadData(filenameOrUrl, fs)
        await storageContext.docStore.addDocuments(documents, true)
        return { ok: true }
    }

    async query(text: string): Promise<
        ResponseStatus & {
            results: {
                filename: string
                id: string
                text: string
                score: number
            }[]
        }
    > {
        const storageContext = await this.createStorageContext()
        const index = await VectorStoreIndex.init({
            storageContext,
        })
        const retreiver = index.asRetriever()
        const results = await retreiver.retrieve(text)
        return {
            ok: true,
            results: results.map((r) => ({
                filename: r.node.sourceNode.nodeId,
                id: r.node.id_,
                text: r.node.getContent(MetadataMode.ALL),
                score: r.score,
            })),
        }
    }
}
