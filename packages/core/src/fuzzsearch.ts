import MiniSearch from "minisearch";
import { resolveFileContent } from "./file";
import { TraceOptions } from "./trace";
import { randomHex } from "./crypto";
import { CancellationOptions, checkCancelled } from "./cancellation";

/**
 * Performs a fuzzy search on a set of workspace files using a query.
 *
 * @param query - The search query string.
 * @param files - An array of WorkspaceFile objects to search through.
 * @param options - Optional FuzzSearch, Trace, and Cancellation options, including a limit on top results, a minimum score threshold, additional search options, and cancellation support.
 * @returns A promise that resolves to an array of WorkspaceFileWithScore, containing the filename, content, and search score.
 */
export async function fuzzSearch(
  query: string,
  files: WorkspaceFile[],
  options?: FuzzSearchOptions & TraceOptions & CancellationOptions,
): Promise<WorkspaceFileWithScore[]> {
  // Destructure options to extract trace and topK, with defaulting to an empty object
  const { trace, topK, minScore, cancellationToken, ...otherOptions } = options || {};

  // Load the content for all provided files asynchronously
  for (const file of files) await resolveFileContent(file);
  checkCancelled(cancellationToken);

  // assign ids
  const filesWithId = files.map((f) => ({
    ...f,
    id: randomHex(32),
  }));

  // Initialize the MiniSearch instance with specified fields and options
  const miniSearch = new MiniSearch({
    idField: "id", // Unique identifier for documents
    fields: ["filename", "content"], // Fields to index for searching
    storeFields: ["filename", "content"], // Fields to store in results
    searchOptions: otherOptions, // Additional search options
  });

  // Add all files with content to the MiniSearch index
  await miniSearch.addAllAsync(filesWithId.filter((f) => !f.encoding && !!f.content));
  checkCancelled(cancellationToken);

  // Perform search using the provided query
  let results = miniSearch.search(query);

  // Limit results to top K if specified
  if (topK > 0) results = results.slice(0, topK);
  if (minScore > 0) results = results.filter((r) => r.score >= minScore);

  // Map search results to WorkspaceFileWithScore structure
  return results.map(
    (r) =>
      <WorkspaceFileWithScore>{
        filename: r.filename, // Map ID to filename
        content: r.content, // Map content from search result
        score: r.score, // Include the relevance score
      },
  );
}
