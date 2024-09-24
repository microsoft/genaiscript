import MiniSearch from "minisearch"
import { resolveFileContent } from "./file"
import { TraceOptions } from "./trace"

/**
 * Performs a fuzzy search on a set of workspace files using a query.
 * 
 * @param query - The search query string.
 * @param files - An array of WorkspaceFile objects to search through.
 * @param options - Optional FuzzSearch and Trace options, including a limit on top results.
 * @returns A promise that resolves to an array of WorkspaceFileWithScore, containing 
 *          the filename, content, and search score.
 */
export async function fuzzSearch(
    query: string,
    files: WorkspaceFile[],
    options?: FuzzSearchOptions & TraceOptions
): Promise<WorkspaceFileWithScore[]> {
    // Destructure options to extract trace and topK, with defaulting to an empty object
    const { trace, topK, ...otherOptions } = options || {}
    
    // Load the content for all provided files asynchronously
    for (const file of files) await resolveFileContent(file)

    // Initialize the MiniSearch instance with specified fields and options
    const miniSearch = new MiniSearch({
        idField: "filename", // Unique identifier for documents
        fields: ["content"], // Fields to index for searching
        storeFields: ["content"], // Fields to store in results
        searchOptions: otherOptions, // Additional search options
    })

    // Add all files with content to the MiniSearch index
    await miniSearch.addAllAsync(files.filter((f) => !!f.content))

    // Perform search using the provided query
    let results = miniSearch.search(query)
    
    // Limit results to top K if specified
    if (topK > 0) results = results.slice(0, topK)
    
    // Map search results to WorkspaceFileWithScore structure
    return results.map(
        (r) =>
            <WorkspaceFileWithScore>{
                filename: r.id, // Map ID to filename
                content: r.content, // Map content from search result
                score: r.score, // Include the relevance score
            }
    )
}
