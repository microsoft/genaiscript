import {
    ChromaClient,
    DefaultEmbeddingFunction,
    IEmbeddingFunction,
} from "chromadb"
import { MarkdownTrace } from "gptools-core"

export interface VectorToken {
    credentials?: string
}

let client: ChromaClient
let embeddingFunction: IEmbeddingFunction

export async function ragStart(token?: VectorToken) {
    client = new ChromaClient({
        auth: token?.credentials
            ? { provider: "token", credentials: "test-token" }
            : undefined,
    })
    embeddingFunction = new DefaultEmbeddingFunction()
    const collections = await client.listCollections()
    console.log(collections.map((c) => c.name).join("\n"))
}

async function getCollection(name: string) {
    const collection = await client.getOrCreateCollection({
        name,
        embeddingFunction,
    })
    return collection
}

export async function ragIndexFiles(name: string, files: LinkedFile[]) {
    const collection = await getCollection(name)
    return await collection.upsert({
        ids: files.map((file) => file.filename),
        documents: files.map((file) => file.content),
        metadatas: files.map((file) => ({
            label: file.label,
            filename: file.filename,
        })),
    })
}

export async function ragQuery(
    name: string,
    queryTexts: string
): Promise<string[]> {
    const collection = await getCollection(name)
    const query = await collection.query({
        nResults: 10,
        queryTexts,
    })
    const documents = query.documents?.[0]
    return documents.filter((d) => d !== null) as string[]
}
