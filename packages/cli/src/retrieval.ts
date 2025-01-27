import { normalizeInt } from "../../core/src/cleaners"
import { resolveFileContents } from "../../core/src/file"
import { expandFiles } from "../../core/src/fs"
import { fuzzSearch } from "../../core/src/fuzzsearch"
import { dotGenaiscriptPath } from "../../core/src/util"
import { vectorSearch } from "../../core/src/vectorsearch"
import { YAMLStringify } from "../../core/src/yaml"

/**
 * This file contains functions to perform retrieval searches on files.
 * It supports both vector-based searches and fuzzy searches.
 */

/**
 * Performs a vector-based retrieval search on specified files.
 * Uses vector embeddings to find top matching files for a query.
 *
 * @param q - The query string to search for.
 * @param filesGlobs - Glob patterns specifying which files to search.
 * @param options - Additional options for the search.
 *   @param excludedFiles - Files to exclude from the search.
 *   @param topK - The number of top results to return.
 *   @param name - Index name for storing vectors.
 *   @param embeddingsModel - Model to use for generating embeddings.
 */
export async function retrievalSearch(
    q: string,
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        topK: string
        name: string
        embeddingsModel: string
    }
) {
    // Destructure options with default values
    const {
        excludedFiles,
        name: indexName,
        topK,
        embeddingsModel,
    } = options || {}

    // Expand file globs and map to WorkspaceFile object
    // Excludes specified files
    const files = (await expandFiles(filesGlobs, excludedFiles)).map(
        (filename) => <WorkspaceFile>{ filename }
    )

    // Resolve the contents of the files to ensure they can be processed
    await resolveFileContents(files)

    // Determine the folder path for storing vectors
    // Uses a default name if none is provided
    const folderPath = dotGenaiscriptPath("vectors", indexName ?? "default")

    // Perform vector search with the given query and options
    // Searches using embeddings to find relevant files
    const res = await vectorSearch(q, files, {
        topK: normalizeInt(topK),
        folderPath,
        embeddingsModel,
    })

    // Output the results in YAML format for readability
    console.log(YAMLStringify(res))
}

/**
 * Performs a fuzzy search on specified files.
 * Uses fuzzy matching to find approximate matches for a query.
 *
 * @param q - The query string to search for.
 * @param filesGlobs - Glob patterns specifying which files to search.
 * @param options - Additional options for the search.
 *   @param excludedFiles - Files to exclude from the search.
 *   @param topK - The number of top results to return.
 */
export async function retrievalFuzz(
    q: string,
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        topK: string
    }
) {
    // Destructure options with default values
    let { excludedFiles, topK } = options || {}

    // Default to searching all files if no globs are provided
    if (!filesGlobs?.length) filesGlobs = ["**"]

    // Default to excluding node_modules if no exclusions are provided
    if (!excludedFiles?.length) excludedFiles = ["**/node_modules/**"]

    // Expand file globs and resolve the list of files
    const files = await expandFiles(filesGlobs, excludedFiles)

    // Log the number of files being searched for transparency
    console.log(`searching '${q}' in ${files.length} files`)

    // Perform fuzzy search with the given query and options
    // Matches against filenames to find approximate matches
    const res = await fuzzSearch(
        q,
        files.map((filename) => ({ filename })),
        { topK: normalizeInt(topK) }
    )

    // Output the results in YAML format for readability
    console.log(YAMLStringify(res))
}
