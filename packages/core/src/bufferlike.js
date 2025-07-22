// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { resolveFileBytes } from "./filebytes.js";
import { fileTypeFromBuffer } from "./filetype.js";
import { extname } from "node:path";
import { genaiscriptDebug } from "./debug.js";
const dbg = genaiscriptDebug("buffer");
async function bufferTryFrom(data) {
    if (data === undefined)
        return undefined;
    if (data instanceof Buffer)
        return data;
    if (data instanceof ArrayBuffer)
        return Buffer.from(data);
    if (data instanceof SharedArrayBuffer)
        return Buffer.from(data);
    return Buffer.from(data);
}
/**
 * Resolves a buffer-like object into a Buffer.
 *
 * @param bufferLike - The input object to resolve. Can be a string (URL), Blob, ReadableStream, ArrayBuffer, Uint8Array, or an object containing a filename property.
 * @param options - Optional tracing options for resolving certain input types, such as file URLs or workspace files.
 * @returns A Promise that resolves to a Buffer representation of the input object.
 * @throws Error if the input type is unsupported.
 */
export async function resolveBufferLike(bufferLike, options) {
    if (bufferLike === undefined)
        return undefined;
    if (typeof bufferLike === "string")
        return bufferTryFrom(await resolveFileBytes(bufferLike, options));
    else if (bufferLike instanceof Blob)
        return bufferTryFrom(await bufferLike.arrayBuffer());
    else if (bufferLike instanceof ReadableStream) {
        const stream = bufferLike;
        return bufferTryFrom(await new Response(stream).arrayBuffer());
    }
    else if (bufferLike instanceof ArrayBuffer)
        return bufferTryFrom(bufferLike);
    else if (bufferLike instanceof SharedArrayBuffer)
        return bufferTryFrom(bufferLike);
    else if (bufferLike instanceof Uint8Array)
        return bufferTryFrom(bufferLike);
    else if (typeof bufferLike === "object" &&
        typeof bufferLike.filename === "string") {
        return Buffer.from(await resolveFileBytes(bufferLike, options));
    }
    dbg(`unsupported: ${typeof bufferLike}`);
    throw new Error(`Unsupported buffer-like object ${typeof bufferLike}`);
}
export async function resolveBufferLikeAndExt(bufferLike, options) {
    const bytes = await resolveBufferLike(bufferLike, options);
    if (!bytes)
        return { bytes, ext: undefined };
    const ext = await fileTypeFromBuffer(bytes);
    if (ext)
        return { bytes, ext: ext.ext };
    else if (typeof bufferLike === "object" &&
        typeof bufferLike.filename === "string" &&
        bufferLike.filename) {
        return {
            bytes,
            ext: extname(bufferLike.filename),
        };
    }
    else if (typeof bufferLike === "string")
        return { bytes, ext: extname(bufferLike) };
    return { bytes, ext: ".bin" };
}
/**
 * Converts a buffer or a Uint8Array into a Blob object.
 *
 * @param buffer - The input data to convert. Can be a Buffer or a Uint8Array.
 * @param mime - Optional MIME type override. If not provided, the MIME type will be inferred from the buffer, or defaults to "application/octet-stream".
 * @returns A Blob object constructed from the input data.
 */
export async function BufferToBlob(buffer, mime) {
    const type = await fileTypeFromBuffer(buffer);
    return new Blob([buffer], {
        type: mime || type?.mime || "application/octet-stream",
    });
}
//# sourceMappingURL=bufferlike.js.map