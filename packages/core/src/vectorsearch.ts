import { encode, decode } from "gpt-tokenizer"
import type { EmbeddingsModel, EmbeddingsResponse } from "vectra"
import { arrayify } from "./util"

export async function vectorSearch(
    query: string,
    files: WorkspaceFile[],
    options: VectorSearchOptions & { folderPath: string }
): Promise<WorkspaceFileWithScore[]> {
    const { topK, folderPath } = options
    const { LocalDocumentIndex } = await import("vectra/lib/LocalDocumentIndex")
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
    for (const file of files) {
        const { filename, content } = file
        await index.upsertDocument(filename, content)
    }
    const res = await index.queryDocuments(query, { maxDocuments: topK })
    const r: WorkspaceFile[] = []
    for (const re of res) {
        r.push(<WorkspaceFileWithScore>{
            filename: re.uri,
            content: (await re.renderAllSections(8000))
                .map((s) => s.text)
                .join("\n...\n"),
            score: re.score
        })
    }
    return r
}
