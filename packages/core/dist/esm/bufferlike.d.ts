import { TraceOptions } from "./trace.js";
/**
 * Resolves a buffer-like object into a Buffer.
 *
 * @param bufferLike - The input object to resolve. Can be a string (URL), Blob, ReadableStream, ArrayBuffer, Uint8Array, or an object containing a filename property.
 * @param options - Optional tracing options for resolving certain input types, such as file URLs or workspace files.
 * @returns A Promise that resolves to a Buffer representation of the input object.
 * @throws Error if the input type is unsupported.
 */
export declare function resolveBufferLike(
  bufferLike: BufferLike,
  options?: TraceOptions,
): Promise<Buffer>;
export declare function resolveBufferLikeAndExt(
  bufferLike: BufferLike,
  options?: TraceOptions,
): Promise<{
  bytes: Buffer;
  ext: string;
}>;
/**
 * Converts a buffer or a Uint8Array into a Blob object.
 *
 * @param buffer - The input data to convert. Can be a Buffer or a Uint8Array.
 * @param mime - Optional MIME type override. If not provided, the MIME type will be inferred from the buffer, or defaults to "application/octet-stream".
 * @returns A Blob object constructed from the input data.
 */
export declare function BufferToBlob(buffer: Buffer | Uint8Array, mime?: string): Promise<Blob>;
//# sourceMappingURL=bufferlike.d.ts.map
