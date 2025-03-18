import { normalizeFloat, normalizeInt } from "../../core/src/cleaners"
import { expandFiles } from "../../core/src/fs"
import { fuzzSearch } from "../../core/src/fuzzsearch"
import { vectorIndex, vectorSearch } from "../../core/src/vectorsearch"
import { YAMLStringify } from "../../core/src/yaml"

export async function retrievalIndex(
    indexName: string,
    filesGlobs: string[],
    options: {
        excludedFiles: string[]
        embeddingsModel: string
        ignoreGitIgnore: boolean
        database: "local" | "azure_ai_search" | "github"
    }
) {
    const { excludedFiles, embeddingsModel, ignoreGitIgnore, database } =
        options || {}
    const files = (
        await expandFiles(filesGlobs, {
            excludedFiles,
            applyGitIgnore: !ignoreGitIgnore,
        })
    ).map((filename) => <WorkspaceFile>{ filename })
    await vectorIndex(indexName, files, {
        embeddingsModel,
        type: database,
    })
}

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
        minScore: string
        name: string
        embeddingsModel: string
        ignoreGitIgnore: boolean
    }
) {
    // Destructure options with default values
    const {
        excludedFiles,
        name: indexName,
        topK,
        minScore,
        embeddingsModel,
        ignoreGitIgnore,
    } = options || {}

    // Expand file globs and map to WorkspaceFile object
    // Excludes specified files
    const files = (
        await expandFiles(filesGlobs, {
            excludedFiles,
            applyGitIgnore: !ignoreGitIgnore,
        })
    ).map((filename) => <WorkspaceFile>{ filename })

    // Perform vector search with the given query and options
    // Searches using embeddings to find relevant files
    const res = await vectorSearch(indexName, q, files, {
        topK: normalizeInt(topK),
        minScore: normalizeFloat(minScore),
        embeddingsModel,
    })

    // Output the results in YAML format for readability
    console.log(
        YAMLStringify(res.map(({ filename, score }) => ({ filename, score })))
    )
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
        minScore: string
        ignoreGitIgnore: boolean
    }
) {
    // Destructure options with default values
    let { excludedFiles, topK, minScore } = options || {}

    // Default to searching all files if no globs are provided
    if (!filesGlobs?.length) filesGlobs = ["**"]

    // Default to excluding node_modules if no exclusions are provided
    if (!excludedFiles?.length) excludedFiles = ["**/node_modules/**"]

    // Expand file globs and resolve the list of files
    const files = await expandFiles(filesGlobs, options)

    // Log the number of files being searched for transparency
    console.log(`searching '${q}' in ${files.length} files`)

    // Perform fuzzy search with the given query and options
    // Matches against filenames to find approximate matches
    const res = await fuzzSearch(
        q,
        files.map((filename) => ({ filename })),
        { topK: normalizeInt(topK), minScore: normalizeFloat(minScore) }
    )

    // Output the results in YAML format for readability
    console.log(
        YAMLStringify(res.map(({ filename, score }) => ({ filename, score })))
    )
}
