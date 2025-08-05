"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataUriToBuffer = dataUriToBuffer;
exports.resolveFileBytes = resolveFileBytes;
exports.resolveFileDataUri = resolveFileDataUri;
/**
 * This module provides functions to handle file content resolution, rendering,
 * and data URI conversion. It includes support for various file formats like
 * PDF, DOCX, XLSX, and CSV.
 */
const fetch_js_1 = require("./fetch.js");
const host_js_1 = require("./host.js");
const cancellation_js_1 = require("./cancellation.js");
const debug_js_1 = require("./debug.js");
const base64_js_1 = require("./base64.js");
const file_type_1 = require("file-type");
const mime_js_1 = require("./mime.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("file:bytes");
/**
 * Converts a data URI into a binary buffer.
 *
 * @param filename - The string to be inspected and potentially decoded. If the string is a valid data URI, its content will be converted to a binary buffer.
 * @returns A binary buffer containing the decoded content of the data URI. Returns undefined if the input is not a valid data URI.
 * @throws Will throw an error if the data URI format is invalid.
 */
function dataUriToBuffer(filename) {
    if (/^data:/i.test(filename)) {
        dbg(`converting data URI to buffer`);
        const matches = filename.match(/^data:[^;]+;base64,(.*)$/i);
        if (!matches) {
            dbg(`invalid data URI format`);
            throw new Error("Invalid data URI format");
        }
        return (0, base64_js_1.fromBase64)(matches[1]);
    }
    return undefined;
}
/**
 * Resolves and returns the file content as bytes.
 * @param filename - The file name, URL, data URI, or WorkspaceFile object to resolve. If a WorkspaceFile object, uses its encoding and content if available. If a string, resolves the file from the provided path, URL, or data URI. Supports both local files and remote URLs.
 * @param options - Optional parameters for tracing operations and fetch configuration. Used for logging operations or canceling the process.
 * @returns A Uint8Array containing the file content as bytes.
 */
async function resolveFileBytes(filename, options) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    if (typeof filename === "object") {
        if (filename.encoding && filename.content) {
            dbg(`resolving file bytes`);
            return new Uint8Array(Buffer.from(filename.content, filename.encoding));
        }
        filename = filename.filename;
    }
    const i = dataUriToBuffer(filename);
    if (i) {
        return i;
    }
    // Fetch file from URL or data-uri
    if (/^https?:\/\//i.test(filename)) {
        dbg(`fetching file from URL: ${filename}`);
        const fetch = await (0, fetch_js_1.createFetch)(options);
        const resp = await fetch(filename);
        const buffer = await resp.arrayBuffer();
        return new Uint8Array(buffer);
    }
    // Read file from local storage
    else {
        dbg(`reading file %s`, filename);
        const stat = await runtimeHost.statFile(filename);
        if (stat?.type !== "file")
            return undefined;
        const buf = await runtimeHost.readFile(filename);
        return new Uint8Array(buf);
    }
}
/**
 * Converts a file to a Data URI format.
 * @param filename - The file name, URL, or data URI to convert. Supports local files, remote URLs, and data URIs. If a WorkspaceFile object, its content and encoding are used.
 * @param options - Optional parameters for tracing operations and fetch configuration.
 * @returns A Data URI string if the MIME type is determined, otherwise undefined.
 */
async function resolveFileDataUri(filename, options) {
    const { cancellationToken, mime } = options || {};
    const bytes = await resolveFileBytes(filename, options);
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    const uriMime = mime || (await (0, file_type_1.fileTypeFromBuffer)(bytes))?.mime || (0, mime_js_1.lookupMime)(filename);
    if (!uriMime) {
        dbg(`no mime type found for ${filename}`);
        return undefined;
    }
    const b64 = (0, base64_js_1.toBase64)(bytes);
    return {
        uri: `data:${uriMime};base64,${b64}`,
        mimeType: uriMime,
        data: b64,
    };
}
//# sourceMappingURL=filebytes.js.map