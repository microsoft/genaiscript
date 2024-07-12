import {
    DOCX_MIME_TYPE,
    JAVASCRIPT_MIME_TYPE,
    JSON_MIME_TYPE,
    JSON_SCHEMA_MIME_TYPE,
    PDF_MIME_TYPE,
} from "./constants"
import {
    RetrievalClientOptions,
    RetrievalSearchOptions,
    RetrievalUpsertOptions,
    runtimeHost,
} from "./host"
import { lookupMime } from "./mime"

const UPSERTFILE_MIME_TYPES = [
    PDF_MIME_TYPE,
    DOCX_MIME_TYPE,
    JSON_MIME_TYPE,
    JSON_SCHEMA_MIME_TYPE,
    JAVASCRIPT_MIME_TYPE,
]

export function isIndexable(filename: string) {
    const type = lookupMime(filename) || "text/plain"
    return /^text\//i.test(type) || UPSERTFILE_MIME_TYPES.includes(type)
}

export async function clearVectorIndex(
    options?: RetrievalClientOptions & VectorSearchOptions
): Promise<void> {
    const { trace } = options || {}
    await runtimeHost.retrieval.init(trace)
    await runtimeHost.retrieval.vectorClear(options)
}

export async function upsertVector(
    fileOrUrls: (string | WorkspaceFile)[],
    options?: RetrievalClientOptions & RetrievalUpsertOptions
) {
    if (!fileOrUrls?.length) return
    const { progress, trace, token, ...rest } = options || {}
    const { llmModel, embedModel } = options || {}
    const { retrieval, models } = runtimeHost
    await retrieval.init(trace)
    if (llmModel || embedModel) {
        progress?.start("pulling models")
        if (llmModel) await models.pullModel(llmModel)
        if (embedModel) await models.pullModel(embedModel)
        progress?.succeed()
    }
    const files: WorkspaceFile[] = fileOrUrls.map((f) =>
        typeof f === "string" ? <WorkspaceFile>{ filename: f } : f
    )
    let count = 0
    for (const f of files) {
        if (token?.isCancellationRequested) break
        progress?.start(f.filename, ++count)
        const { ok } = await retrieval.vectorUpsert(f.filename, {
            content: f.content,
            ...rest,
        })
        progress?.report({
            message: f.filename,
            succeeded: ok,
        })
        trace?.resultItem(ok, f.filename)
    }
}

export interface RetrievalSearchResult {
    files: WorkspaceFile[]
    chunks: WorkspaceFile[]
}

export async function vectorSearch(
    q: string,
    options?: RetrievalClientOptions & RetrievalSearchOptions
): Promise<RetrievalSearchResult> {
    const { trace, token, ...rest } = options || {}
    const files: WorkspaceFileWithScore[] = []
    const retrieval = runtimeHost.retrieval
    await retrieval.init(trace)
    if (token?.isCancellationRequested) return { files, chunks: [] }

    const { results: chunks = [] } = await retrieval.vectorSearch(q, rest)

    for (const chunk of chunks) {
        let file = files.find((f) => f.filename === chunk.filename)
        if (!file) {
            file = <WorkspaceFile>{ ...chunk }
            files.push(file)
        } else {
            file.content += chunk.content + `\n...`
            file.score = (file.score + chunk.score) / 2
        }
    }
    return {
        files,
        chunks,
    }
}
