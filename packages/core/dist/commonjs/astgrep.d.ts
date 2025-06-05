import { CancellationOptions } from "./cancellation.js";
/**
 * Creates an instance of a change set for managing and committing AST node edits.
 *
 * This function initializes an empty change set, which can be used for tracking edits
 * to AST nodes, associating them with their corresponding file roots, and committing
 * the changes back to files.
 *
 * @returns A new change set instance to handle AST edits.
 */
export declare function astGrepCreateChangeSet(): SgChangeSet;
/**
 * Searches for files matching specific criteria based on file patterns and match rules,
 * and performs analysis or modifications on matched nodes in the files.
 *
 * @param lang - The language of the files to search, such as JavaScript or HTML.
 * @param glob - A single or array of glob patterns to match file paths.
 * @param matcher - The match criteria, either a string pattern or a specific matcher object.
 * @param options - Optional parameters, including cancellation options and options for file search.
 *   - cancellationToken: A token to handle operation interruptions.
 *   - diff: A diff object to filter files based on changes.
 *
 * @returns An object containing:
 * - `files`: The number of files scanned.
 * - `matches`: The list of matched nodes.
 *
 * @throws An error if `glob` or `matcher` is not provided.
 */
export declare function astGrepFindFiles(
  lang: SgLang,
  glob: ElementOrArray<string>,
  matcher: string | SgMatcher,
  options?: SgSearchOptions & CancellationOptions,
): ReturnType<Sg["search"]>;
/**
 * Writes edits to the roots of the provided nodes to their corresponding files.
 *
 * @param nodes - An array of AST nodes whose root edits need to be written.
 * @param options - Optional configuration for cancellation, containing a cancellation token to handle operation interruptions.
 *
 * The function iterates through the unique roots of the provided nodes, checks for file content differences,
 * and writes updated content to the respective files if changes are detected. If a file does not have a filename, it is skipped.
 */
export declare function astGrepWriteRootEdits(
  nodes: SgNode[],
  options?: CancellationOptions,
): Promise<void>;
/**
 * Parses a given file into an abstract syntax tree (AST) root node.
 *
 * @param file - The input file to parse. Must include filename, encoding, and content properties.
 * @param options - Optional parameters:
 *   - lang: Specifies the programming or markup language for parsing. If not provided, attempts to infer from the file name.
 *   - cancellationToken: Optional cancellation token to abort the operation if necessary.
 *
 * @returns The parsed AST root node. Returns undefined if the file is binary or language cannot be resolved.
 *
 * Notes:
 * - Skips binary files based on the `encoding` property.
 * - Automatically resolves file content before parsing.
 * - Uses the library "@ast-grep/napi" for parsing.
 */
export declare function astGrepParse(
  file: WorkspaceFile,
  options?: {
    lang?: SgLang | Record<string, SgLang>;
  } & CancellationOptions,
): Promise<SgRoot>;
//# sourceMappingURL=astgrep.d.ts.map
