"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchText = fetchText;
exports.traceFetchPost = traceFetchPost;
const util_js_1 = require("./util.js");
const host_js_1 = require("./host.js");
const filetype_js_1 = require("./filetype.js");
const binary_js_1 = require("./binary.js");
const base64_js_1 = require("./base64.js");
const cleaners_js_1 = require("./cleaners.js");
const pretty_js_1 = require("./pretty.js");
const url_js_1 = require("./url.js");
const html_js_1 = require("./html.js");
const fetch_js_1 = require("./fetch.js");
const debug_js_1 = require("./debug.js");
const utf8_js_1 = require("./utf8.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("fetch:text");
/**
 * Fetches text content from a URL or file.
 *
 * Fetches content from an HTTP(S) URL or reads from the file system for local files.
 * Retries on specific HTTP statuses if configured. Supports tracing and cancellation.
 * Handles binary content using base64 encoding.
 *
 * @param urlOrFile - The URL or file path to fetch from. If a string, it is treated as a filename.
 * @param fetchOptions - Configuration for retries, delays, tracing, cancellation, and fetch settings.
 *   - retries: Number of retry attempts.
 *   - retryDelay: Initial delay between retries.
 *   - retryOn: HTTP status codes to retry on.
 *   - maxDelay: Maximum delay between retries.
 *   - trace: Trace options for logging.
 *   - cancellationToken: Token to cancel the fetch operation.
 * @returns An object containing fetch status, content, metadata, and file details.
 */
async function fetchText(urlOrFile, fetchOptions) {
    const { retries, retryDelay, retryOn, maxDelay, trace, convert, cancellationToken, ...rest } = fetchOptions || {};
    if (typeof urlOrFile === "string") {
        urlOrFile = {
            filename: urlOrFile,
            content: "",
        };
    }
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const url = urlOrFile.filename;
    let ok = false;
    let status = 404;
    let statusText;
    let bytes;
    if (/^https?:\/\//i.test(url)) {
        dbg("requesting external URL: %s", (0, url_js_1.uriRedact)(url));
        const f = await (0, fetch_js_1.createFetch)({
            retries,
            retryDelay,
            retryOn,
            maxDelay,
            trace,
            cancellationToken,
        });
        const resp = await f(url, rest);
        ok = resp.ok;
        status = resp.status;
        statusText = resp.statusText;
        if (ok) {
            dbg("status %d, %s", status, statusText);
            const buf = await resp.arrayBuffer();
            bytes = new Uint8Array(buf);
        }
    }
    else {
        dbg("reading file from local path: %s", url);
        try {
            bytes = await runtimeHost.readFile(url);
        }
        catch (e) {
            (0, util_js_1.logVerbose)(e);
            ok = false;
            status = 404;
        }
    }
    let content;
    let encoding;
    let type;
    const size = bytes?.length;
    const mime = await (0, filetype_js_1.fileTypeFromBuffer)(bytes);
    if ((0, binary_js_1.isBinaryMimeType)(mime?.mime)) {
        dbg("binary mime type detected, content will be base64 encoded, mime: %o", mime);
        encoding = "base64";
        content = (0, base64_js_1.toBase64)(bytes);
    }
    else {
        dbg("text mime type detected, decoding content as UTF-8, mime: %o", mime);
        content = (0, utf8_js_1.createUTF8Decoder)().decode(bytes);
        if (convert === "markdown")
            content = await (0, html_js_1.HTMLToMarkdown)(content, {
                trace,
                cancellationToken,
            });
        else if (convert === "text")
            content = await (0, html_js_1.HTMLToText)(content, { trace, cancellationToken });
        else if (convert === "tables")
            content = JSON.stringify(await (0, html_js_1.HTMLTablesToJSON)(content));
    }
    ok = true;
    const file = (0, cleaners_js_1.deleteUndefinedValues)({
        filename: urlOrFile.filename,
        encoding,
        type,
        content,
        size,
    });
    return {
        ok,
        status,
        statusText,
        text: content,
        bytes,
        file,
    };
}
/**
 * Logs a POST request for tracing.
 *
 * Constructs an HTTP POST request representation, including headers and body, for tracing purposes.
 * Authorization headers can be optionally masked.
 *
 * @param trace - Trace object for logging details. If not provided, logs the command verbosely.
 * @param url - Target URL for the request.
 * @param headers - Headers to include in the request. Sensitive authorization headers may be masked.
 * @param body - Request body, either as FormData or a raw object. FormData fields include file sizes if applicable.
 * @param options - Configuration for masking authorization headers.
 */
function traceFetchPost(trace, url, headers, body, options) {
    if (!trace) {
        return;
    }
    const { showAuthorization } = options || {};
    headers = { ...(headers || {}) };
    if (!showAuthorization) {
        Object.entries(headers)
            .filter(([k]) => /^(authorization|api-key|ocp-apim-subscription-key)$/i.test(k))
            .forEach(([k]) => (headers[k] = /Bearer /i.test(headers[k])
            ? "Bearer ***" // Mask Bearer tokens
            : "***"));
    }
    // Start building the HTTP request
    let httpRequest = `POST ${url} HTTP/1.1\n`;
    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
        httpRequest += `${key}: ${value}\n`;
    });
    // Add body
    if (body instanceof FormData) {
        const boundary = "------------------------" + Date.now().toString(16);
        httpRequest += `Content-Type: multipart/form-data; boundary=${boundary}\n\n`;
        body.forEach((value, key) => {
            httpRequest += `--${boundary}\n`;
            httpRequest += `Content-Disposition: form-data; name="${key}"`;
            if (value instanceof File) {
                httpRequest += `; filename="${value.name}"\n`;
                httpRequest += `Content-Type: ${value.type || "application/octet-stream"}\n\n`;
                httpRequest += `... (${(0, pretty_js_1.prettyBytes)(value.size)})\n`;
            }
            else {
                httpRequest += "\n\n" + value + "\n";
            }
        });
        httpRequest += `--${boundary}--\n`;
    }
    else {
        httpRequest += "\n" + JSON.stringify(body, null, 2);
    }
    dbg(httpRequest);
    if (trace)
        trace.detailsFenced(`🌐 fetch`, httpRequest, "http");
}
//# sourceMappingURL=fetchtext.js.map