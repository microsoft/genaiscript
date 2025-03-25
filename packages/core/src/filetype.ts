/**
 * Determines the file type from a given buffer.
 * 
 * @param buffer The input data from which to infer the file type.
 * @returns The inferred file type or undefined if the buffer is not provided.
 * 
 * @async
 * This function asynchronously imports the 'file-type' module to analyze the given buffer.
 */
export async function fileTypeFromBuffer(buffer: Uint8Array | ArrayBuffer) {
    if (buffer === undefined) return undefined

    const { fileTypeFromBuffer } = await import("file-type")
    return fileTypeFromBuffer(buffer)
}
