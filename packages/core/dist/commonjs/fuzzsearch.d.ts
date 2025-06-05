import { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
/**
 * Performs a fuzzy search on a set of workspace files using a query.
 *
 * @param query - The search query string.
 * @param files - An array of WorkspaceFile objects to search through.
 * @param options - Optional FuzzSearch, Trace, and Cancellation options, including a limit on top results, a minimum score threshold, additional search options, and cancellation support.
 * @returns A promise that resolves to an array of WorkspaceFileWithScore, containing the filename, content, and search score.
 */
export declare function fuzzSearch(
  query: string,
  files: WorkspaceFile[],
  options?: FuzzSearchOptions & TraceOptions & CancellationOptions,
): Promise<WorkspaceFileWithScore[]>;
//# sourceMappingURL=fuzzsearch.d.ts.map
