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
import { logVerbose, toStringList } from "./util"
import { CancellationToken } from "./cancellation"

export async function createFetch(
    options?: {
        retryOn?: number[]
        retries?: number
        retryDelay?: number
        maxDelay?: number
        cancellationToken?: CancellationToken
    } & TraceOptions
) {
    const {
        retries = FETCH_RETRY_DEFAULT,
        retryOn = [429, 500],
        trace,
        retryDelay = FETCH_RETRY_DEFAULT_DEFAULT,
        maxDelay = FETCH_RETRY_MAX_DELAY_DEFAULT,
        cancellationToken,
    } = options || {}

    if (!retryOn?.length) return crossFetch

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
                // fatal
                return undefined

            const message = errorMessage(error)
            const status = statusToMessage(response)
            const delay = Math.min(
                maxDelay,
                Math.pow(FETCH_RETRY_GROWTH_FACTOR, attempt) * retryDelay
            )
            const msg = toStringList(
                `retry #${attempt + 1} in ${Math.floor(delay) / 1000}s`,
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

export function traceFetchPost(
    trace: MarkdownTrace,
    url: string,
    headers: Record<string, string>,
    body: any,
    options?: { showAuthorization?: boolean }
) {
    const { showAuthorization } = options || {}
    headers = { ...(headers || {}) }
    if (!showAuthorization)
        Object.entries(headers)
            .filter(([k]) => /^(authorization|api-key)$/i.test(k))
            .forEach(
                ([k]) =>
                    (headers[k] = /Bearer /i.test(headers[k])
                        ? "Bearer ***"
                        : "***")
            )
    const cmd = `curl ${url} \\
-H  "Content-Type: application/json" \\
${Object.entries(headers)
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join("\\\n")} \\
-d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}' 
`
    if (trace) trace.detailsFenced(`✉️ fetch`, cmd, "bash")
    else logVerbose(cmd)
}

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
