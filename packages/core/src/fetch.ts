import crossFetch from "cross-fetch"
import wrapFetch from "fetch-retry"
import { MarkdownTrace, TraceOptions } from "./trace"
import {
    FETCH_RETRY_DEFAULT,
    FETCH_RETRY_DEFAULT_DEFAULT,
    FETCH_RETRY_GROWTH_FACTOR,
    FETCH_RETRY_MAX_DELAY_DEFAULT,
} from "./constants"
import { errorMessage } from "./error"
import { logVerbose, roundWithPrecision, toStringList } from "./util"
import { CancellationToken } from "./cancellation"
import { readText } from "./fs"

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
) {
    const {
        retries = FETCH_RETRY_DEFAULT,
        retryOn = [429, 500, 504],
        trace,
        retryDelay = FETCH_RETRY_DEFAULT_DEFAULT,
        maxDelay = FETCH_RETRY_MAX_DELAY_DEFAULT,
        cancellationToken,
    } = options || {}

    // Return the default fetch if no retry status codes are specified
    if (!retryOn?.length) return crossFetch

    // Create a fetch function with retry logic
    const fetchRetry = await wrapFetch(crossFetch, {
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
                `retry #${attempt + 1} in ${roundWithPrecision(Math.floor(delay) / 1000, 1)}s`,
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
    fetchOptions?: FetchTextOptions
) {
    if (typeof urlOrFile === "string") {
        urlOrFile = {
            filename: urlOrFile,
            content: "",
        }
    }
    const url = urlOrFile.filename
    let ok = false
    let status = 404
    let text: string
    if (/^https?:\/\//i.test(url)) {
        const fetch = await createFetch()
        const resp = await fetch(url, fetchOptions)
        ok = resp.ok
        status = resp.status
        if (ok) text = await resp.text()
    } else {
        try {
            text = await readText("workspace://" + url)
            ok = true
        } catch (e) {
            logVerbose(e)
            ok = false
            status = 404
        }
    }
    const file: WorkspaceFile = {
        filename: urlOrFile.filename,
        content: text,
    }
    return {
        ok,
        status,
        text,
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
    body: any,
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
    const cmd = `curl "${url}" \\
--no-buffer \\
${Object.entries(headers)
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join(" \\\n")} \\
-d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}'
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
