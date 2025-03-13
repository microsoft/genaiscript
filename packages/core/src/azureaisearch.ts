import {
    CancellationOptions,
    checkCancelled,
    toSignal,
} from "../../core/src/cancellation"
import {
    EmbeddingFunction,
    WorkspaceFileIndexCreator,
} from "../../core/src/chat"
import { arrayify } from "../../core/src/cleaners"
import { runtimeHost } from "../../core/src/host"
import { TraceOptions } from "../../core/src/trace"
import { logVerbose } from "./util"
import type { TokenCredential, KeyCredential } from "@azure/core-auth"
import { resolveFileContents } from "./file"
import { hash } from "./crypto"
import { LanguageModelConfiguration } from "./server/messages"
import { chunk } from "./encoders"

const HASH_LENGTH = 64
export const azureAISearchIndex: WorkspaceFileIndexCreator = async (
    indexName: string,
    cfg: LanguageModelConfiguration,
    embedder: EmbeddingFunction,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
) => {
    // https://learn.microsoft.com/en-us/azure/search/search-security-rbac?tabs=roles-portal-admin%2Croles-portal%2Croles-portal-query%2Ctest-portal%2Ccustom-role-portal
    const {
        trace,
        cancellationToken,
        deleteIfExists,
        chunkOverlap = 128,
        chunkSize = 512,
    } = options || {}
    const vectorSize = 1536
    const abortSignal = toSignal(cancellationToken)
    const { SearchClient, SearchIndexClient, AzureKeyCredential } =
        await import("@azure/search-documents")

    const endPoint = process.env.AZURE_AI_SEARCH_ENDPOINT
    if (!endPoint)
        throw new Error("AZURE_AI_SEARCH_ENDPOINT is not configured.")
    let credential: TokenCredential | KeyCredential
    const apiKey = process.env.AZURE_AI_SEARCH_API_KEY
    if (apiKey) credential = new AzureKeyCredential(apiKey)
    else {
        const { token } = await runtimeHost.azureToken.token("default", {
            cancellationToken,
        })
        checkCancelled(cancellationToken)
        if (!token)
            throw new Error(
                "Azure AI Search requires a valid Azure token credential."
            )
        credential = token.credential
    }

    logVerbose(`azure ai search: ${indexName}`)
    const indexClient = new SearchIndexClient(endPoint, credential, {})
    if (deleteIfExists)
        await indexClient.deleteIndex(indexName, { abortSignal })
    const created = await indexClient.createOrUpdateIndex({
        name: indexName,
        fields: [
            { name: "id", type: "Edm.String", key: true },
            {
                name: "filename",
                type: "Edm.String",
                searchable: true,
                filterable: true,
                sortable: true,
            },
            { name: "lineStart", type: "Edm.Int32", filterable: true },
            { name: "lineEnd", type: "Edm.Int32", filterable: true },
            { name: "content", type: "Edm.String", searchable: true },
            {
                name: "contentVector",
                type: "Collection(Edm.Single)",
                searchable: true,
                vectorSearchDimensions: vectorSize,
                vectorSearchProfileName: "content-vector-profile",
            },
        ],
        vectorSearch: {
            profiles: [
                {
                    name: "content-vector-profile",
                    algorithmConfigurationName: "content-vector-algorithm",
                },
            ],
            algorithms: [
                {
                    name: "content-vector-algorithm",
                    kind: "hnsw",
                    parameters: {
                        m: 4,
                        efConstruction: 400,
                        efSearch: 500,
                        metric: "cosine",
                    },
                },
            ],
        },
    })
    trace?.detailsFenced(`azure ai search ${indexName}`, created, "json")

    type TextChunkEntry = TextChunk & { id: string; contentVector: number[] }
    const client = new SearchClient<TextChunkEntry>(
        endPoint,
        indexName,
        credential,
        {}
    )

    const chunkId = async (chunk: TextChunk) =>
        await hash(
            [chunk.filename ?? chunk.content, chunk.lineEnd, chunk.lineEnd],
            { length: HASH_LENGTH }
        )

    return Object.freeze({
        name: indexName,
        insertOrUpdate: async (file: ElementOrArray<WorkspaceFile>) => {
            const files = arrayify(file)
            await resolveFileContents(files, { cancellationToken })
            const docs: TextChunkEntry[] = []
            for (const file of files) {
                const chunks = await chunk(file, {
                    chunkSize,
                    chunkOverlap,
                })
                for (const chunk of chunks) {
                    const vector = await embedder(chunk.content, cfg, options)
                    checkCancelled(cancellationToken)
                    if (vector.status !== "success")
                        throw new Error(vector.error || vector.status)
                    docs.push({
                        id: await chunkId(chunk),
                        ...chunk,
                        contentVector: vector.data[0],
                    })
                }
            }
            if (!docs.length) return

            const res = await client.mergeOrUploadDocuments(docs, {
                abortSignal,
                throwOnAnyFailure: false,
            })
            for (const r of res.results) {
                if (!r.succeeded)
                    logVerbose(`  ${r.key} ${r.errorMessage} (${r.statusCode})`)
            }
        },
        search: async (query: string, options?: VectorSearchOptions) => {
            const { topK, minScore = 0 } = options || {}

            const vector = await embedder(query, cfg, {
                trace,
                cancellationToken,
            })
            checkCancelled(cancellationToken)
            if (vector.status !== "success")
                throw new Error(vector.error || vector.status)

            const docs = await client.search(query, {
                searchMode: "all",
                vectorSearchOptions: {
                    queries: [
                        {
                            kind: "vector",
                            vector: vector.data[0],
                            fields: ["contentVector"],
                            kNearestNeighborsCount: 3,
                        },
                    ],
                },
            })
            const res: WorkspaceFileWithScore[] = []
            for await (const doc of docs.results) {
                if (doc.score < minScore) continue
                res.push({ ...doc.document, score: doc.score })
                if (res.length >= topK) break
            }
            return res
        },
    } satisfies WorkspaceFileIndex)
}
