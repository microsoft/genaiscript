import { encode, decode } from "gpt-tokenizer"
import { host, RetrievalSearchResponse } from "./host"
import { EmbeddingsModel, EmbeddingsResponse, LocalDocumentIndex } from "vectra"
import { arrayify, dotGenaiscriptPath } from "./util"
import { randomHex } from "./crypto"

export async function vectorSearch(
    query: string,
    files: WorkspaceFile[],
    options?: VectorSearchOptions
): Promise<WorkspaceFile[]> {
    const { topK, minScore } = options || {}

    const folderPath = dotGenaiscriptPath(`vectors/${randomHex(8).toString()}`)
    await host.createDirectory(folderPath)
    const tokenizer = { encode, decode }
    const embeddings: EmbeddingsModel = {
        maxTokens: 8000,
        createEmbeddings: async (
            inputs: string | string[]
        ): Promise<EmbeddingsResponse> => ({
            status: "success",
            output: arrayify(inputs).map((input) => encode(input)),
        }),
    }
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
    await index.beginUpdate()
    for (const file of files) {
        const { filename, content } = file
        await index.upsertDocument(filename, content)
    }
    await index.endUpdate()
    const res = await index.queryDocuments(query, { maxDocuments: topK })
    const r: WorkspaceFile[] = []
    for (const re of res) {
        r.push(<WorkspaceFile>{
            filename: re.uri,
            content: (await re.renderAllSections(8000))
                .map((s) => s.text)
                .join("\n...\n"),
        })
    }
    return r
}
