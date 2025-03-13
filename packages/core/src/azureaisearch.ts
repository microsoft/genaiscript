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
import { resolveFileContent } from "./file"
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
        vectorSize = 1536,
    } = options || {}
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

    logVerbose(
        `azure ai search: ${indexName}, embedder ${cfg.provider}:${cfg.model}, ${vectorSize} dimensions`
    )
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
            const outdated: TextChunkEntry[] = []
            const docs: TextChunkEntry[] = []
            for (const file of files) {
                await resolveFileContent(file, { cancellationToken })
                if (file.encoding) continue

                const newChunks = await chunk(file, {
                    chunkSize,
                    chunkOverlap,
                })
                const oldChunks = await client.search(undefined, {
                    filter: `filename eq '${file.filename}'`,
                })
                for await (const result of oldChunks.results) {
                    const oldChunk = result.document
                    const index = newChunks.findIndex(
                        (c) =>
                            c.lineStart === oldChunk.lineStart &&
                            c.lineEnd === oldChunk.lineEnd &&
                            c.content === oldChunk.content
                    )
                    if (index > -1) newChunks.splice(index, 1)
                    else outdated.push(oldChunk)
                }

                // new chunks
                for (const chunk of newChunks) {
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

            logVerbose(
                `azure ai search: ${indexName} index ${outdated.length} outdated, ${docs.length} updated`
            )
            if (outdated.length) {
                const res = await client.deleteDocuments(outdated, {
                    abortSignal,
                    throwOnAnyFailure: false,
                })
                for (const r of res.results) {
                    if (!r.succeeded)
                        logVerbose(
                            `  ${r.key} ${r.errorMessage} (${r.statusCode})`
                        )
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
