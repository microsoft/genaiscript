import { config } from "dotenv"
import {
    CancellationOptions,
    checkCancelled,
    toSignal,
} from "../../core/src/cancellation"
import { WorkspaceFileIndexCreator } from "../../core/src/chat"
import { arrayify } from "../../core/src/cleaners"
import {
    MODEL_PROVIDER_AZURE_AI_INFERENCE,
    TOOL_ID,
} from "../../core/src/constants"
import { runtimeHost } from "../../core/src/host"
import { TraceOptions } from "../../core/src/trace"
import { AzureKeyCredential } from "@azure/search-documents"

export const azureAISearchIndex: WorkspaceFileIndexCreator = async (
    indexName: string,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
) => {
    const { trace, cancellationToken } = options || {}
    const abortSignal = toSignal(cancellationToken)

    const { credential } = await runtimeHost.azureToken.token("default", {
        cancellationToken,
    })
    checkCancelled(cancellationToken)
    if (!credential)
        throw new Error(
            "Azure AI Search requires a valid Azure token credential."
        )

    const { SearchClient } = await import("@azure/search-documents")
    const endPoint = process.env.AZURE_AI_SEARCH_ENDPOINT
    const client = new SearchClient<WorkspaceFile>(
        endPoint,
        indexName,
        credential,
        {}
    )

    return Object.freeze({
        name: indexName,
        size: async () => {
            const res = await client.getDocumentsCount({ abortSignal })
            return res
        },
        upload: async (file: ElementOrArray<WorkspaceFile>) => {
            const files = arrayify(file)
            await client.mergeOrUploadDocuments(files, {
                abortSignal,
                throwOnAnyFailure: false,
            })
        },
        search: async (query: string, options?: VectorSearchOptions) => {
            const { topK, minScore = 0 } = options || {}
            const docs = await client.search(query, {})
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
