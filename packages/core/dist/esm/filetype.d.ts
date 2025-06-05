/**
 * Determines the file type of a given buffer.
 *
 * @param buffer - The input data to analyze. Must be a Uint8Array or ArrayBuffer.
 *                 If undefined, the function returns undefined.
 * @returns The detected file type object, or undefined if no buffer is provided or type cannot be determined.
 */
export declare function fileTypeFromBuffer(
  buffer: Uint8Array | ArrayBuffer,
): Promise<import("file-type").FileTypeResult>;
//# sourceMappingURL=filetype.d.ts.map
