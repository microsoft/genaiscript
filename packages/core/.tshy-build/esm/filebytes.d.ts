import type { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
import type { WorkspaceFile } from "./types.js";
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
export declare function resolveFileBytes(filename: string | WorkspaceFile, options?: TraceOptions & CancellationOptions): Promise<Uint8Array>;
/**
 * Converts a file to a Data URI format.
 * @param filename - The file name, URL, or data URI to convert. Supports local files, remote URLs, and data URIs. If a WorkspaceFile object, its content and encoding are used.
 * @param options - Optional parameters for tracing operations and fetch configuration.
 * @returns A Data URI string if the MIME type is determined, otherwise undefined.
 */
export declare function resolveFileDataUri(filename: string, options?: TraceOptions & CancellationOptions & {
    mime?: string;
}): Promise<{
    uri: string;
    mimeType: string;
    data: string;
}>;
//# sourceMappingURL=filebytes.d.ts.map