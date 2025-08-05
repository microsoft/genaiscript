import type { WorkspaceFile } from "./types.js";
/**
 * Reads data from standard input with a timeout mechanism and returns it wrapped in a `WorkspaceFile` object.
 * The function determines the MIME type of the input and processes it accordingly as binary or text data.
 *
 * If the input is binary, it encodes the content in base64. If the input is text, it converts the content to a UTF-8 string.
 *
 * @returns A `WorkspaceFile` object containing the parsed input data, or undefined if there is no data or if a timeout occurs.
 */
export declare function readStdIn(): Promise<WorkspaceFile>;
//# sourceMappingURL=stdin.d.ts.map