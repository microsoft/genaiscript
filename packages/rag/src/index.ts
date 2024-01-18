import { ChromaClient } from "chromadb"
import { embeddingFunction } from "chromadb-default-embed"
import { MarkdownTrace, OAIToken } from "gptools-core"

export interface VectorToken {
    credentials?: string
}

async function startVectorDb(token?: VectorToken) {
    const client = new ChromaClient({
        auth: token?.credentials
            ? { provider: "token", credentials: "test-token" }
            : undefined,
    })
    const collection = await client.getOrCreateCollection({
        name: "sources",
        embeddingFunction,
    })
    return { client, collection }
}

export async function stats(token: VectorToken, trace: MarkdownTrace) {
    try {
        trace.startDetails(`embedded documents`)
        const { collection } = await startVectorDb(token)

        const count = await collection.count()
        trace.item(`count: ${count}`)
    } catch (e) {
        trace.error("error", e)
    } finally {
        trace.endDetails()
    }
    return stats
}

export async function upsertFiles(token: VectorToken, files: LinkedFile[]) {
    const { collection } = await startVectorDb(token)
    return await collection.upsert({
        ids: files.map((file) => file.filename),
        documents: files.map((file) => file.content),
        metadatas: files.map((file) => ({
            label: file.label,
            filename: file.filename,
        })),
    })
}

export async function query(
    token: VectorToken,
    queryTexts: string
): Promise<string[]> {
    const { collection } = await startVectorDb(token)
    const query = await collection.query({
        nResults: 10,
        queryTexts,
    })
    const documents = query.documents?.[0]
    return documents.filter((d) => d !== null) as string[]
}
