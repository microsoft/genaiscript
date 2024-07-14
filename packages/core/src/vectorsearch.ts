import { encode, decode } from "gpt-tokenizer"
import type {
    OSSEmbeddingsOptions,
    AzureOpenAIEmbeddingsOptions,
    OpenAIEmbeddingsOptions,
} from "vectra"
import { resolveModelConnectionInfo } from "./models"
import {
    DEFAULT_EMBEDDINGS_MODEL,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_OPENAI,
} from "./constants"

export async function vectorSearch(
    query: string,
    files: WorkspaceFile[],
    options: VectorSearchOptions & { folderPath: string }
): Promise<WorkspaceFileWithScore[]> {
    const {
        topK,
        folderPath,
        model = DEFAULT_EMBEDDINGS_MODEL,
        minScore = 0,
    } = options
    const { LocalDocumentIndex, OpenAIEmbeddings } = await import("vectra")

    const tokenizer = { encode, decode }
    const { info, configuration } = await resolveModelConnectionInfo({
        model,
    })
    if (info.error) throw new Error(info.error)
    const embeddings = new OpenAIEmbeddings(
        info.provider === MODEL_PROVIDER_AZURE
            ? <AzureOpenAIEmbeddingsOptions>{
                  azureApiKey: configuration.token,
                  azureApiVersion: configuration.version,
                  azureDeployment: configuration.model,
                  azureEndpoint: configuration.base,
              }
            : info.provider === MODEL_PROVIDER_OPENAI
              ? <OpenAIEmbeddingsOptions>{
                    apiKey: configuration.token,
                    endpoint: configuration.base,
                    model: configuration.model,
                }
              : <OSSEmbeddingsOptions>{
                    ossModel: configuration.model,
                    ossEndpoint: configuration.base,
                }
    )
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
    const r: WorkspaceFileWithScore[] = []
    for (const re of res) {
        r.push(<WorkspaceFileWithScore>{
            filename: re.uri,
            content: (await re.renderAllSections(8000))
                .map((s) => s.text)
                .join("\n...\n"),
            score: re.score,
        })
    }
    return r.filter((_) => _.score >= minScore)
}
