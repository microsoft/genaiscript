/**
 * Determines the file type of a given buffer.
 *
 * @param buffer - The input data to analyze. Must be a Uint8Array or ArrayBuffer.
 *                 If undefined, the function returns undefined.
 * @returns The detected file type object, or undefined if no buffer is provided or type cannot be determined.
 */
export async function fileTypeFromBuffer(buffer: Uint8Array | ArrayBuffer) {
  if (buffer === undefined) return undefined;

  const { fileTypeFromBuffer } = await import("file-type");
  return fileTypeFromBuffer(buffer);
}
