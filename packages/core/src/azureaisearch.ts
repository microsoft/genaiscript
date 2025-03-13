import {
    CancellationOptions,
    checkCancelled,
    toSignal,
} from "../../core/src/cancellation"
import { WorkspaceFileIndexCreator } from "../../core/src/chat"
import { arrayify } from "../../core/src/cleaners"
import { runtimeHost } from "../../core/src/host"
import { TraceOptions } from "../../core/src/trace"
import { logVerbose } from "./util"
import type { TokenCredential, KeyCredential } from "@azure/core-auth"
import { resolveFileContents } from "./file"
import { hash } from "./crypto"

export const azureAISearchIndex: WorkspaceFileIndexCreator = async (
    indexName: string,
    options?: VectorIndexOptions & TraceOptions & CancellationOptions
) => {
    const { trace, cancellationToken, deleteIfExists } = options || {}
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
            { name: "content", type: "Edm.String", searchable: true },
        ],
    })
    trace?.detailsFenced(`azure ai search ${indexName}`, created, "json")

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
            await resolveFileContents(files, { cancellationToken })
            const docs = await Promise.all(
                files
                    .filter(({ encoding }) => !encoding)
                    .map(async ({ filename, content }) => ({
                        id: await hash(filename ?? content, { length: 18 }),
                        filename,
                        content,
                    }))
            )
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
