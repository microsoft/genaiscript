import parseDiff from "parse-diff";
/**
 * Parses a diff string into a structured format.
 *
 * @param input - The diff string to parse. Should be in a valid diff format.
 * @returns An array of parsed file objects. If the input is empty or invalid, returns an empty array.
 */
export declare function diffParse(input: string): parseDiff.File[];
/**
 * Resolves the input into an array of DiffFile objects.
 *
 * @param input - The input to resolve. Can be a diff string in valid format or an ElementOrArray of DiffFile objects.
 * @returns An array of DiffFile objects. If the input is a string, it is parsed into DiffFile objects using diffParse. If the input is already an ElementOrArray of DiffFile objects, it is converted to an array using arrayify.
 */
export declare function diffResolve(input: string | ElementOrArray<DiffFile>): DiffFile[];
/**
 * Attempts to parse a diff string into a structured format.
 * If parsing fails, logs the error message and returns an empty array.
 *
 * @param diff - The diff string to parse.
 * @returns An array of parsed file objects if successful, or an empty array if parsing fails. Logs an error message if parsing fails.
 */
export declare function tryDiffParse(diff: string): parseDiff.File[];
/**
 * Creates a unified diff between two workspace files.
 * If the input is a string, it is wrapped in a WorkspaceFile object with a default filename.
 * If the input is an object, it should contain a filename and content.
 *
 * @param left - The original workspace file or its content. If a string, it is wrapped in a WorkspaceFile object with the filename "left".
 * @param right - The modified workspace file or its content. If a string, it is wrapped in a WorkspaceFile object with the filename "right".
 * @param options - Optional parameters, such as the number of context lines, case sensitivity, and whitespace handling. Defaults to ignoring case and whitespace. Additional options can be provided.
 * @returns The diff as a string, with redundant headers removed. The diff is generated using createTwoFilesPatch.
 */
export declare function diffCreatePatch(
  left: string | WorkspaceFile,
  right: string | WorkspaceFile,
  options?: {
    context?: number;
    ignoreCase?: boolean;
    ignoreWhitespace?: boolean;
  },
): string;
/**
 * Finds a chunk in a diff corresponding to a specified file and line number.
 *
 * @param file - The file path to search for in the diff. Can be empty to search all files.
 * @param range - The line number or numbers (zero-based) to locate in the specified file's diff.
 * @param diff - The diff data, containing an array of file diffs. Can be a single diff file or an array of diff files.
 * @returns An object containing the matching file and the chunk if found, or an object with only the file if no chunk matches. Returns undefined if no file matches.
 */
export declare function diffFindChunk(
  file: string,
  range: number | [number, number],
  diff: ElementOrArray<DiffFile>,
):
  | {
      file?: DiffFile;
      chunk?: DiffChunk;
    }
  | undefined;
//# sourceMappingURL=diff.d.ts.map
