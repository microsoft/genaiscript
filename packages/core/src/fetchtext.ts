import { MarkdownTrace, TraceOptions } from "./trace"
import { logVerbose } from "./util"
import { CancellationOptions } from "./cancellation"
import { host } from "./host"
import { fileTypeFromBuffer } from "./filetype"
import { isBinaryMimeType } from "./binary"
import { toBase64 } from "./base64"
import { deleteUndefinedValues } from "./cleaners"
import { prettyBytes } from "./pretty"
import debug from "debug"
import { uriRedact } from "./url"
import { HTMLTablesToJSON, HTMLToMarkdown, HTMLToText } from "./html"
import { createFetch } from "./fetch"
const dbg = debug("genaiscript:fetch:text")

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
export async function fetchText(
    urlOrFile: string | WorkspaceFile,
    fetchOptions?: FetchTextOptions & TraceOptions & CancellationOptions
) {
    const {
        retries,
        retryDelay,
        retryOn,
        maxDelay,
        trace,
        convert,
        cancellationToken,
        ...rest
    } = fetchOptions || {}
    if (typeof urlOrFile === "string") {
        urlOrFile = {
            filename: urlOrFile,
            content: "",
        }
    }
    const url = urlOrFile.filename
    let ok = false
    let status = 404
    let statusText: string
    let bytes: Uint8Array
    if (/^https?:\/\//i.test(url)) {
        dbg("requesting external URL: %s", uriRedact(url))
        const f = await createFetch({
            retries,
            retryDelay,
            retryOn,
            maxDelay,
            trace,
            cancellationToken,
        })
        const resp = await f(url, rest)
        ok = resp.ok
        status = resp.status
        statusText = resp.statusText
        if (ok) {
            dbg("status %d, %s", status, statusText)
            const buf = await resp.arrayBuffer()
            bytes = new Uint8Array(buf)
        }
    } else {
        dbg("reading file from local path: %s", url)
        try {
            bytes = await host.readFile(url)
        } catch (e) {
            logVerbose(e)
            ok = false
            status = 404
        }
    }

    let content: string
    let encoding: "base64"
    let type: string
    const size = bytes?.length
    const mime = await fileTypeFromBuffer(bytes)
    if (isBinaryMimeType(mime?.mime)) {
        dbg(
            "binary mime type detected, content will be base64 encoded, mime: %o",
            mime
        )
        encoding = "base64"
        content = toBase64(bytes)
    } else {
        dbg(
            "text mime type detected, decoding content as UTF-8, mime: %o",
            mime
        )
        content = host.createUTF8Decoder().decode(bytes)
        if (convert === "markdown")
            content = await HTMLToMarkdown(content, {
                trace,
                cancellationToken,
            })
        else if (convert === "text")
            content = await HTMLToText(content, { trace, cancellationToken })
        else if (convert === "tables")
            content = JSON.stringify(await HTMLTablesToJSON(content))
    }
    ok = true
    const file: WorkspaceFile = deleteUndefinedValues({
        filename: urlOrFile.filename,
        encoding,
        type,
        content,
        size,
    })

    return {
        ok,
        status,
        statusText,
        text: content,
        bytes,
        file,
    }
}

/**
 * Logs a POST request for tracing.
 *
 * Constructs a curl command to represent the POST request, including headers
 * and body. Authorization headers can be optionally masked.
 *
 * @param trace - Trace object for logging details. If not provided, logs the command verbosely.
 * @param url - Target URL for the request.
 * @param headers - Headers to include in the request. Sensitive authorization headers may be masked.
 * @param body - Request body, either as FormData or a raw object. FormData fields include file sizes if applicable.
 * @param options - Configuration for masking authorization headers.
 */
export function traceFetchPost(
    trace: MarkdownTrace,
    url: string,
    headers: Record<string, string>,
    body: FormData | any,
    options?: { showAuthorization?: boolean }
) {
    if (!trace) {
        return
    }
    const { showAuthorization } = options || {}
    headers = { ...(headers || {}) }
    if (!showAuthorization) {
        Object.entries(headers)
            .filter(([k]) =>
                /^(authorization|api-key|ocp-apim-subscription-key)$/i.test(k)
            )
            .forEach(
                ([k]) =>
                    (headers[k] = /Bearer /i.test(headers[k])
                        ? "Bearer ***" // Mask Bearer tokens
                        : "***") // Mask other authorization headers
            )
    }
    let cmd = `curl ${url} \\
--no-buffer \\
${Object.entries(headers)
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join(" \\\n")} \\
`
    if (body instanceof FormData) {
        body.forEach((value, key) => {
            cmd += `-F ${key}=${value instanceof File ? `... (${prettyBytes(value.size)})` : "" + value}\n`
        })
    } else {
        cmd += `-d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'
`
    }
    if (trace) {
        trace.detailsFenced(`🌐 fetch`, cmd, "bash")
    } else {
        logVerbose(cmd)
    }
}
