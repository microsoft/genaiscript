import { resolveFileBytes } from "./file"
import { TraceOptions } from "./trace"
import { fileTypeFromBuffer } from "./filetype"

/**
 * Resolves a buffer-like object into a Buffer.
 *
 * @param bufferLike - The input object to resolve. Can be a string (URL), Blob, ReadableStream, ArrayBuffer, Uint8Array, or an object containing a filename property.
 * @param options - Optional tracing options for resolving certain input types, such as file URLs or workspace files.
 * @returns A Promise that resolves to a Buffer representation of the input object.
 * @throws Error if the input type is unsupported.
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
 * Converts a buffer or a Uint8Array into a Blob object.
 *
 * @param buffer - The input data to convert. Can be a Buffer or a Uint8Array.
 * @param mime - Optional MIME type override. If not provided, the MIME type will be inferred from the buffer, or defaults to "application/octet-stream".
 * @returns A Blob object constructed from the input data.
 */
export async function BufferToBlob(buffer: Buffer | Uint8Array, mime?: string) {
    const type = await fileTypeFromBuffer(buffer)
    return new Blob([buffer], {
        type: mime || type?.mime || "application/octet-stream",
    })
}
