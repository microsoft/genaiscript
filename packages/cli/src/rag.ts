import {
    ChromaClient,
    DefaultEmbeddingFunction,
    IEmbeddingFunction,
    IncludeEnum,
} from "chromadb"

export interface VectorToken {
    credentials?: string
}

let client: ChromaClient
let embeddingFunction: IEmbeddingFunction

export async function connect(token?: VectorToken) {
    client = new ChromaClient({
        auth: token?.credentials
            ? { provider: "token", credentials: "test-token" }
            : undefined,
    })
    embeddingFunction = new DefaultEmbeddingFunction()
    return {
        version: await client.version(),
        heartbeat: await client.heartbeat(),
    }
}

async function getCollection(name: string) {
    const collection = await client.getOrCreateCollection({
        name,
        embeddingFunction,
    })
    return collection
}

export async function indexFiles(name: string, files: LinkedFile[]) {
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

export async function queryFiles(
    name: string,
    queryTexts: string | string[],
    options: {
        nResults?: number
    } = {}
): Promise<LinkedFile[]> {
    const collection = await getCollection(name)
    const query = await collection.query({
        queryTexts,
        include: [
            IncludeEnum.Documents,
            IncludeEnum.Metadatas,
            IncludeEnum.Distances,
        ],
        ...options,
    })
    const documents = query.documents?.[0]
    const metadatas = query.metadatas?.[0]
    const distances = query.distances?.[0]
    return documents
        .map(
            (d, i) =>
                <LinkedFile>{
                    filename: metadatas[i]?.filename,
                    label: metadatas[i]?.label,
                    distance: distances[i],
                    content: d,
                }
        )
        .filter((d) => d.content !== null)
}
