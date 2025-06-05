import { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
/**
 * Resolves the content of a file by decoding, fetching, or parsing it based on its type or source.
 *
 * @param file - The file object containing filename, content, type, and encoding.
 * @param options - Optional parameters:
 *   - trace - Object for logging operations.
 *   - cancellationToken - Token to cancel the operation.
 *   - maxFileSize - Maximum file size for processing. Defaults to MAX_FILE_CONTENT_SIZE.
 * @returns The updated file object with resolved content or metadata. If the file cannot be resolved, it is returned as is.
 */
export declare function resolveFileContent(
  file: WorkspaceFile,
  options?: TraceOptions & {
    maxFileSize?: number;
  } & CancellationOptions,
): Promise<WorkspaceFile>;
/**
 * Converts input into a WorkspaceFile structure.
 * @param fileOrFilename - A filename string or an object representing a WorkspaceFile.
 * @returns A WorkspaceFile object with the provided filename or the original WorkspaceFile object.
 */
export declare function toWorkspaceFile(fileOrFilename: string | WorkspaceFile): WorkspaceFile;
/**
 * Resolves the contents of multiple files asynchronously.
 * Processes each file to resolve its content based on type or source.
 * @param files - List of files to process and resolve.
 * @param options - Optional parameters:
 *   - cancellationToken - Token to cancel the operation if needed.
 *   - trace - Object for logging and tracing operations.
 */
export declare function resolveFileContents(
  files: WorkspaceFile[],
  options?: CancellationOptions & TraceOptions,
): Promise<void>;
/**
 * Renders the content of a file into a markdown format if applicable.
 * Supports rendering for CSV and XLSX file types by converting their contents into readable markdown tables.
 *
 * @param file - The file object containing filename and content. If the content matches a supported format, it will be rendered.
 * @param options - Options for tracing operations and filtering the file data during rendering. Includes data transformation, markdown table generation, and optional sheet trimming for XLSX files.
 * @returns An object containing the filename and rendered content, or the original file object if rendering is not applicable.
 */
export declare function renderFileContent(
  file: WorkspaceFile,
  options: TraceOptions & DataFilter,
): Promise<{
  filename: string;
  type?: string;
  encoding?: "base64";
  content?: string;
  size?: number;
}>;
/**
 * Converts a data URI into a binary buffer.
 *
 * @param filename - The string to be inspected and potentially decoded. If the string is a valid data URI, its content will be converted to a binary buffer.
 * @returns A binary buffer containing the decoded content of the data URI. Returns undefined if the input is not a valid data URI.
 * @throws Will throw an error if the data URI format is invalid.
 */
export declare function dataUriToBuffer(filename: string): Uint8Array<ArrayBufferLike>;
/**
 * Resolves and returns the file content as bytes.
 * @param filename - The file name, URL, data URI, or WorkspaceFile object to resolve. If a WorkspaceFile object, uses its encoding and content if available. If a string, resolves the file from the provided path, URL, or data URI. Supports both local files and remote URLs.
 * @param options - Optional parameters for tracing operations and fetch configuration. Used for logging operations or canceling the process.
 * @returns A Uint8Array containing the file content as bytes.
 */
export declare function resolveFileBytes(
  filename: string | WorkspaceFile,
  options?: TraceOptions & CancellationOptions,
): Promise<Uint8Array>;
/**
 * Converts a file to a Data URI format.
 * @param filename - The file name, URL, or data URI to convert. Supports local files, remote URLs, and data URIs. If a WorkspaceFile object, its content and encoding are used.
 * @param options - Optional parameters for tracing operations and fetch configuration.
 * @returns A Data URI string if the MIME type is determined, otherwise undefined.
 */
export declare function resolveFileDataUri(
  filename: string,
  options?: TraceOptions &
    CancellationOptions & {
      mime?: string;
    },
): Promise<{
  uri: string;
  mimeType: string;
  data: string;
}>;
//# sourceMappingURL=file.d.ts.map
