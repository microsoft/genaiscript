import { resolveFileBytes } from "./file"
import { TraceOptions } from "./trace"
import { fileTypeFromBuffer } from "./filetype"

/**
 * Resolves a buffer-like object into a Buffer.
 * Supports various input types including string URLs, Blob, ReadableStream,
 * ArrayBuffer, Uint8Array, and objects containing a filename.
 * 
 * @param bufferLike - The buffer-like object to resolve.
 * @param options - Optional tracing options for resolution.
 * 
 * @returns A Promise that resolves to a Buffer.
 * 
 * @throws Error if the provided buffer-like object is unsupported.
 */
export async function resolveBufferLike(
    bufferLike: BufferLike,
    options?: TraceOptions
): Promise<Buffer> {
    // If the URL is a string, resolve it to a data URI
    if (typeof bufferLike === "string")
        return Buffer.from(await resolveFileBytes(bufferLike, options))
    else if (bufferLike instanceof Blob)
        return Buffer.from(await bufferLike.arrayBuffer())
    else if (bufferLike instanceof ReadableStream) {
        const stream: ReadableStream = bufferLike
        return Buffer.from(await new Response(stream).arrayBuffer())
    } else if (bufferLike instanceof ArrayBuffer) return Buffer.from(bufferLike)
    else if (bufferLike instanceof Uint8Array) return Buffer.from(bufferLike)
    else if (
        typeof bufferLike === "object" &&
        (bufferLike as WorkspaceFile).filename
    ) {
        return Buffer.from(
            await resolveFileBytes(bufferLike as WorkspaceFile, options)
        )
    }
    console.log(bufferLike)
    throw new Error("Unsupported buffer-like object")
}

/**
 * Converts a Buffer or Uint8Array to a Blob, optionally specifying the MIME type.
 * The MIME type is inferred from the buffer if not provided.
 *
 * @param buffer - The data to be converted.
 * @param mime - Optional MIME type for the Blob. If not provided, detected from the buffer.
 * @returns A Blob containing the data from the buffer.
 */
export async function BufferToBlob(buffer: Buffer | Uint8Array, mime?: string) {
    const type = await fileTypeFromBuffer(buffer)
    return new Blob([buffer], {
        type: mime || type?.mime || "application/octet-stream",
    })
}
