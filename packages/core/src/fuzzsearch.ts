import MiniSearch from "minisearch"
import { resolveFileContent } from "./file"
import { TraceOptions } from "./trace"

export async function fuzzSearch(
    query: string,
    files: WorkspaceFile[],
    options?: FuzzSearchOptions & TraceOptions
): Promise<WorkspaceFileWithScore[]> {
    const { trace, topK, ...otherOptions } = options || {}
    // load all files
    for (const file of files) await resolveFileContent(file)

    // create database
    const miniSearch = new MiniSearch({
        idField: "filename",
        fields: ["content"],
        storeFields: ["content"],
        searchOptions: otherOptions,
    })
    // Add documents to the index
    await miniSearch.addAllAsync(files.filter((f) => !!f.content))

    // Search for documents:
    let results = miniSearch.search(query)
    if (topK > 0) results = results.slice(0, topK)
    return results.map(
        (r) =>
            <WorkspaceFileWithScore>{
                filename: r.id,
                content: r.content,
                score: r.score,
            }
    )
}
