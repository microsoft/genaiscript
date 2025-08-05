import type { TraceOptions } from "./trace.js";
import type { WorkspaceFile } from "./types.js";
/**
 * Performs a Tavily search using the given query and options.
 * Uses the Tavily Search API to construct and execute the request with query parameters.
 * Handles API key retrieval, request construction, and error management.
 * Logs the query and response details for tracing purposes.
 * @param q - The search query string.
 * @param options - Optional parameters including trace, endpoint, count, and API key handling. If ignoreMissingApiKey is true, the function returns undefined when the API key is missing.
 * @returns A Promise resolving to a list of search responses, each containing a URL and content.
 * @throws Error if the API key is missing or if the search request fails.
 */
export declare function tavilySearch(q: string, options?: {
    ignoreMissingApiKey?: boolean;
    endPoint?: string;
    count?: number;
} & TraceOptions): Promise<WorkspaceFile[]>;
//# sourceMappingURL=websearch.d.ts.map