import crossFetch from "cross-fetch"
import wrapFetch from "fetch-retry"
import { TraceOptions } from "./trace"
import {
    FETCH_RETRY_DEFAULT,
    FETCH_RETRY_DEFAULT_DEFAULT,
    FETCH_RETRY_MAX_DELAY_DEFAULT,
} from "./constants"
import { errorMessage } from "./error"
import { logVerbose, toStringList } from "./util"

export async function createFetch(
    options?: {
        retryOn?: number[]
        retries?: number
        retryDelay?: number
        maxDelay?: number
    } & TraceOptions
) {
    const {
        retries = FETCH_RETRY_DEFAULT,
        retryOn = [429, 500],
        trace,
        retryDelay = FETCH_RETRY_DEFAULT_DEFAULT,
        maxDelay = FETCH_RETRY_MAX_DELAY_DEFAULT,
    } = options || {}

    if (!retryOn?.length) return crossFetch

    const fetchRetry = await wrapFetch(crossFetch, {
        retryOn,
        retries,
        retryDelay: (attempt, error, response) => {
            const code: string = (error as any)?.code as string
            if (code === "ECONNRESET" || code === "ENOTFOUND")
                // fatal
                return undefined
            const message = errorMessage(error)
            const status = statusToMessage(response)
            const delay = Math.min(maxDelay, Math.pow(2, attempt) * retryDelay)
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
