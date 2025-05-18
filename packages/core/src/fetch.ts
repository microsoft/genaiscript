import wrapFetch from "fetch-retry"
import { TraceOptions } from "./trace"
import {
    FETCH_RETRY_DEFAULT,
    FETCH_RETRY_DEFAULT_DEFAULT,
    FETCH_RETRY_GROWTH_FACTOR,
    FETCH_RETRY_MAX_DELAY_DEFAULT,
    FETCH_RETRY_ON_DEFAULT,
} from "./constants"
import { errorMessage } from "./error"
import { logVerbose } from "./util"
import { CancellationOptions, CancellationToken } from "./cancellation"
import { resolveHttpProxyAgent } from "./proxy"
import { host } from "./host"
import { renderWithPrecision } from "./precision"
import crossFetch from "cross-fetch"
import debug from "debug"
import { prettyStrings } from "./pretty"
const dbg = debug("genaiscript:fetch")

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
    options?: TraceOptions & CancellationOptions & RetryOptions
): Promise<FetchType> {
    const {
        retries = FETCH_RETRY_DEFAULT,
        retryOn = FETCH_RETRY_ON_DEFAULT,
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
              crossFetch(url, { ...(options || {}), dispatcher: agent } as any)
        : crossFetch

    // Return the default fetch if no retry status codes are specified
    if (!retryOn?.length) {
        dbg("no retry logic applied, using crossFetchWithProxy directly")
        return crossFetchWithProxy
    }

    // Create a fetch function with retry logic
    const fetchRetry = wrapFetch(crossFetchWithProxy, {
        retryOn,
        retries,
        retryDelay: (attempt, error, response) => {
            const code: string = (error as any)?.code as string
            dbg(`retry attempt: %d, error code: %s`, attempt, code)
            if (
                code === "ECONNRESET" ||
                code === "ENOTFOUND" ||
                cancellationToken?.isCancellationRequested
            ) {
                dbg("fatal error or cancellation")
                // Return undefined for fatal errors or cancellations to stop retries
                return undefined
            }

            const message = errorMessage(error)
            const status = statusToMessage(response)
            const delay =
                Math.min(
                    maxDelay,
                    Math.pow(FETCH_RETRY_GROWTH_FACTOR, attempt) * retryDelay
                ) *
                (1 + Math.random() / 20) // 5% jitter for delay randomization
            const msg = prettyStrings(
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

/**
 * Executes an HTTP(S) request with optional retry logic.
 *
 * Wraps the input request with retry capabilities and additional configurations.
 * Leverages `createFetch` to handle retry conditions and builds a final fetch function.
 *
 * @param input - The input to the fetch request. Can be a string URL, URL object, or Request object.
 * @param options - Configuration options for the fetch operation.
 *   - retryOn: Array of HTTP status codes to retry on.
 *   - retries: Number of retry attempts.
 *   - retryDelay: Initial delay between retries in milliseconds.
 *   - maxDelay: Maximum allowable delay between retries in milliseconds.
 *   - trace: Trace options for logging the fetch operation.
 *   - ...rest: Additional options passed to the fetch request.
 * @returns A Promise resolving with the HTTP Response.
 */
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
    return prettyStrings(
        typeof status === "number" ? status + "" : undefined,
        statusText
    )
}

export async function tryReadText(res: Response, defaultValue?: string) {
    try {
        const text = await res.text()
        return text
    } catch (e) {
        dbg(e)
        return defaultValue
    }
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
            if (done) {
                break
            }
            const text = decoder.decode(value, { stream: true })
            yield text
        }
    } else {
        for await (const value of r.body as any) {
            if (cancellationToken?.isCancellationRequested) {
                break
            }
            const text = decoder.decode(value, { stream: true })
            yield text
        }
    }
}
