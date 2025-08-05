import type { ParseZipOptions, WorkspaceFile } from "./types.js";
/**
 * Unzips a given byte array representing a ZIP file and extracts its contents into WorkspaceFile objects.
 *
 * @param data - A byte array containing the ZIP file data to be unzipped.
 * @param options - Optional parsing options. Supports a `glob` parameter to filter files by name using glob patterns.
 *                  If no options are provided, all files are extracted.
 * @returns A promise that resolves to an array of WorkspaceFile objects containing the extracted file data.
 */
export declare function unzip(data: Uint8Array, options?: ParseZipOptions): Promise<WorkspaceFile[]>;
//# sourceMappingURL=zip.d.ts.map