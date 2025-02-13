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
import prettyBytes from "pretty-bytes"
import { fileTypeFromBuffer } from "./filetype"
import { isBinaryMimeType } from "./binary"
import { toBase64 } from "./base64"
import { deleteUndefinedValues } from "./cleaners"

export type FetchType = (
    input: string | URL | globalThis.Request,
    options?: FetchOptions & TraceOptions
) => Promise<Response>

/**
 * Creates a fetch function with retry logic.
 *
 * This function wraps the `crossFetch` with retry capabilities based
 * on provided options. It allows configuring the number of retries,
 * delay between retries, and specific HTTP status codes to retry on.
 *
 * @param options - Options for retry configuration and tracing.
 * @returns A fetch function with retry capabilities.
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
        retryOn = [429, 500, 504],
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
 * This function attempts to fetch content from either a URL or a local file.
 * It supports HTTP(S) URLs and reads directly from the file system for local files.
 *
 * @param urlOrFile - The URL or file to fetch from.
 * @param fetchOptions - Optional fetch configuration.
 * @returns An object containing fetch status and content.
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
    })
    return {
        ok,
        status,
        text: content,
        bytes,
        file,
    }
}

/**
 * Logs a POST request for tracing.
 *
 * Constructs a curl command representing the POST request with appropriate headers
 * and body, optionally masking sensitive information like authorization headers.
 *
 * @param trace - Markdown trace object for logging.
 * @param url - The URL of the request.
 * @param headers - The request headers.
 * @param body - The request body.
 * @param options - Options for displaying authorization header.
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
 * Converts a response status to a message.
 *
 * Converts the HTTP response status and status text into a string list
 * to facilitate logging and debugging.
 *
 * @param res - The response object.
 * @returns A list of status and status text.
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
