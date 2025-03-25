import wrapFetch from "fetch-retry"
import { MarkdownTrace, TraceOptions } from "./trace"
import {
    FETCH_RETRY_DEFAULT,
    FETCH_RETRY_DEFAULT_DEFAULT,
    FETCH_RETRY_GROWTH_FACTOR,
    FETCH_RETRY_MAX_DELAY_DEFAULT,
} from "./constants"
import { errorMessage } from "./error"
import { logVerbose, toStringList } from "./util"
import { CancellationOptions, CancellationToken } from "./cancellation"
import { resolveHttpProxyAgent } from "./proxy"
import { host } from "./host"
import { renderWithPrecision } from "./precision"
import crossFetch from "cross-fetch"
import { fileTypeFromBuffer } from "./filetype"
import { isBinaryMimeType } from "./binary"
import { toBase64 } from "./base64"
import { deleteUndefinedValues } from "./cleaners"
import { prettyBytes } from "./pretty"

export type FetchType = (
    input: string | URL | globalThis.Request,
    options?: FetchOptions & TraceOptions
) => Promise<Response>

/**
 * Creates a fetch function with retry logic.
 *
 * Wraps `crossFetch` with retry capabilities based on the provided options. 
 * Configures the number of retries, delay between retries, HTTP status codes to retry on, 
 * and supports cancellation and proxy configuration.
 *
 * @param options - Configuration for retries, delays, HTTP status codes, cancellation token, and tracing.
 *   - retryOn: HTTP status codes to retry on.
 *   - retries: Number of retry attempts.
 *   - retryDelay: Initial delay between retries.
 *   - maxDelay: Maximum delay between retries.
 *   - cancellationToken: Token to cancel the fetch.
 *   - trace: Trace options for logging.
 * @returns A fetch function with retry and cancellation support.
 */
export async function createFetch(
    options?: {
        retryOn?: number[] // HTTP status codes to retry on
        retries?: number // Number of retry attempts
        retryDelay?: number // Initial delay between retries
        maxDelay?: number // Maximum delay between retries
        cancellationToken?: CancellationToken // Token to cancel the fetch
    } & TraceOptions
): Promise<FetchType> {
    const {
        retries = FETCH_RETRY_DEFAULT,
        retryOn = [408, 429, 500, 504],
        trace,
        retryDelay = FETCH_RETRY_DEFAULT_DEFAULT,
        maxDelay = FETCH_RETRY_MAX_DELAY_DEFAULT,
        cancellationToken,
    } = options || {}

    // We create a proxy based on Node.js environment variables.
    const agent = resolveHttpProxyAgent()

    // We enrich crossFetch with the proxy.
    const crossFetchWithProxy: typeof fetch = agent
        ? (url, options) =>
              crossFetch(url, { ...(options || {}), agent } as any)
        : crossFetch

    // Return the default fetch if no retry status codes are specified
    if (!retryOn?.length) return crossFetchWithProxy

    // Create a fetch function with retry logic
    const fetchRetry = wrapFetch(crossFetchWithProxy, {
        retryOn,
        retries,
        retryDelay: (attempt, error, response) => {
            const code: string = (error as any)?.code as string
            if (
                code === "ECONNRESET" ||
                code === "ENOTFOUND" ||
                cancellationToken?.isCancellationRequested
            )
                // Return undefined for fatal errors or cancellations to stop retries
                return undefined

            const message = errorMessage(error)
            const status = statusToMessage(response)
            const delay =
                Math.min(
                    maxDelay,
                    Math.pow(FETCH_RETRY_GROWTH_FACTOR, attempt) * retryDelay
                ) *
                (1 + Math.random() / 20) // 5% jitter for delay randomization
            const msg = toStringList(
                `retry #${attempt + 1} in ${renderWithPrecision(Math.floor(delay) / 1000, 1)}s`,
                message,
                status
            )
            logVerbose(msg)
            trace?.resultItem(false, msg)
            return delay
        },
    })
    return fetchRetry
}

export async function fetch(
    input: string | URL | globalThis.Request,
    options?: FetchOptions & TraceOptions
): Promise<Response> {
    const { retryOn, retries, retryDelay, maxDelay, trace, ...rest } =
        options || {}
    const f = await createFetch({
        retryOn,
        retries,
        retryDelay,
        maxDelay,
        trace,
    })
    return f(input, rest)
}

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
    fetchOptions?: FetchTextOptions & TraceOptions
) {
    const { retries, retryDelay, retryOn, maxDelay, trace, ...rest } =
        fetchOptions || {}
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
        const f = await createFetch({
            retries,
            retryDelay,
            retryOn,
            maxDelay,
            trace,
        })
        const resp = await f(url, rest)
        ok = resp.ok
        status = resp.status
        statusText = resp.statusText
        if (ok) bytes = new Uint8Array(await resp.arrayBuffer())
    } else {
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
        encoding = "base64"
        content = toBase64(bytes)
    } else {
        content = host.createUTF8Decoder().decode(bytes)
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
    if (!trace) return
    const { showAuthorization } = options || {}
    headers = { ...(headers || {}) }
    if (!showAuthorization)
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
    } else
        cmd += `-d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'
`
    if (trace) trace.detailsFenced(`✉️ fetch`, cmd, "bash")
    else logVerbose(cmd)
}

/**
 * Converts the HTTP response status and status text into a list of strings.
 *
 * Extracts the status and status text from the response object for logging and debugging.
 *
 * @param res - The HTTP response object. Includes optional status and statusText fields.
 * @returns A list of strings containing the status and status text if provided.
 */
export function statusToMessage(res?: {
    status?: number
    statusText?: string
}) {
    const { status, statusText } = res || {}
    return toStringList(
        typeof status === "number" ? status + "" : undefined,
        statusText
    )
}

export async function* iterateBody(
    r: Response,
    options?: CancellationOptions
): AsyncGenerator<string> {
    const { cancellationToken } = options || {}
    const decoder = host.createUTF8Decoder() // UTF-8 decoder for processing data
    if (r.body.getReader) {
        const reader = r.body.getReader()
        while (!cancellationToken?.isCancellationRequested) {
            const { done, value } = await reader.read()
            if (done) break
            const text = decoder.decode(value, { stream: true })
            yield text
        }
    } else {
        for await (const value of r.body as any) {
            if (cancellationToken?.isCancellationRequested) break
            const text = decoder.decode(value, { stream: true })
            yield text
        }
    }
}
