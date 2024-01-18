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
        metadata: { "hnsw:space": "cosine" },
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
        distance?: number
    } = {}
): Promise<{ file: LinkedFile; distance: number }[]> {
    const { nResults, distance } = options
    const collection = await getCollection(name)
    const query = await collection.query({
        queryTexts,
        include: [
            IncludeEnum.Documents,
            IncludeEnum.Metadatas,
            IncludeEnum.Distances,
        ],
        nResults,
    })
    const documents = query.documents?.[0]
    const metadatas = query.metadatas?.[0]
    const distances = query.distances?.[0]
    return documents
        .map((d, i) => ({
            file: <LinkedFile>{
                filename: metadatas[i]?.filename,
                label: metadatas[i]?.label,
                content: d,
            },
            distance: distances[i],
        }))
        .filter(
            (d) =>
                d.file.content !== null &&
                (isNaN(distance) || d.distance < distance)
        )
}
