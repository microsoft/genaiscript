import { ChromaClient } from "chromadb"
import { OpenAIEmbeddingFunction } from "chromadb"
import { OAIToken } from "gptools-core"

async function startVectorDb(token: OAIToken) {
    const client = new ChromaClient()
    const embedder = new OpenAIEmbeddingFunction({
        openai_api_key: token.token,
    })
    const collection = await client.createCollection({
        name: "sources",
        embeddingFunction: embedder,
    })
}
