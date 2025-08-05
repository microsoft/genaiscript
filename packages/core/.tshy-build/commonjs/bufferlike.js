"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBufferLike = resolveBufferLike;
exports.resolveBufferLikeAndExt = resolveBufferLikeAndExt;
exports.BufferToBlob = BufferToBlob;
const filebytes_js_1 = require("./filebytes.js");
const filetype_js_1 = require("./filetype.js");
const node_path_1 = require("node:path");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("buffer");
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
async function resolveBufferLike(bufferLike, options) {
    if (bufferLike === undefined)
        return undefined;
    if (typeof bufferLike === "string")
        return bufferTryFrom(await (0, filebytes_js_1.resolveFileBytes)(bufferLike, options));
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
        return Buffer.from(await (0, filebytes_js_1.resolveFileBytes)(bufferLike, options));
    }
    dbg(`unsupported: ${typeof bufferLike}`);
    throw new Error(`Unsupported buffer-like object ${typeof bufferLike}`);
}
async function resolveBufferLikeAndExt(bufferLike, options) {
    const bytes = await resolveBufferLike(bufferLike, options);
    if (!bytes)
        return { bytes, ext: undefined };
    const ext = await (0, filetype_js_1.fileTypeFromBuffer)(bytes);
    if (ext)
        return { bytes, ext: ext.ext };
    else if (typeof bufferLike === "object" &&
        typeof bufferLike.filename === "string" &&
        bufferLike.filename) {
        return {
            bytes,
            ext: (0, node_path_1.extname)(bufferLike.filename),
        };
    }
    else if (typeof bufferLike === "string")
        return { bytes, ext: (0, node_path_1.extname)(bufferLike) };
    return { bytes, ext: ".bin" };
}
/**
 * Converts a buffer or a Uint8Array into a Blob object.
 *
 * @param buffer - The input data to convert. Can be a Buffer or a Uint8Array.
 * @param mime - Optional MIME type override. If not provided, the MIME type will be inferred from the buffer, or defaults to "application/octet-stream".
 * @returns A Blob object constructed from the input data.
 */
async function BufferToBlob(buffer, mime) {
    const type = await (0, filetype_js_1.fileTypeFromBuffer)(buffer);
    return new Blob([buffer], {
        type: mime || type?.mime || "application/octet-stream",
    });
}
//# sourceMappingURL=bufferlike.js.map