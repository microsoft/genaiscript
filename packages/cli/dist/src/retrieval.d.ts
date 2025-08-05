/**
 * Generates a vector index for retrieval tasks by processing specified files.
 *
 * @param indexName - Name of the index to be created.
 * @param filesGlobs - Glob patterns defining the target files for indexing.
 * @param options - Additional configuration options.
 *   @param excludedFiles - List of files to exclude from indexing.
 *   @param embeddingsModel - Model used to generate embeddings.
 *   @param ignoreGitIgnore - Whether to bypass .gitignore rules.
 *   @param database - Backend type for storing the generated index. Can be "local" or "azure_ai_search".
 */
export declare function retrievalIndex(indexName: string, filesGlobs: string[], options: {
    excludedFiles: string[];
    embeddingsModel: string;
    ignoreGitIgnore: boolean;
    database: "local" | "azure_ai_search";
}): Promise<void>;
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
 *   @param minScore - The minimum score threshold for results.
 *   @param name - Index name for storing vectors.
 *   @param embeddingsModel - Model to use for generating embeddings.
 *   @param ignoreGitIgnore - Whether to ignore .gitignore rules.
 */
export declare function retrievalSearch(q: string, filesGlobs: string[], options: {
    excludedFiles: string[];
    topK: string;
    minScore: string;
    name: string;
    embeddingsModel: string;
    ignoreGitIgnore: boolean;
}): Promise<void>;
/**
 * Performs a fuzzy search on specified files.
 * Uses fuzzy matching to find approximate matches for a query.
 *
 * @param q - The query string to search for.
 * @param filesGlobs - Glob patterns specifying which files to search. Defaults to all files if not provided.
 * @param options - Additional options for the search.
 *   @param excludedFiles - Files to exclude from the search. Defaults to excluding node_modules if not provided.
 *   @param topK - The number of top results to return.
 *   @param minScore - The minimum score threshold for matches.
 *   @param ignoreGitIgnore - Whether to ignore .gitignore rules.
 */
export declare function retrievalFuzz(q: string, filesGlobs: string[], options: {
    excludedFiles: string[];
    topK: string;
    minScore: string;
    ignoreGitIgnore: boolean;
}): Promise<void>;
//# sourceMappingURL=retrieval.d.ts.map