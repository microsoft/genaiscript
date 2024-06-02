import crossFetch from "cross-fetch"
import wrapFetch from "fetch-retry"
import { TraceOptions } from "./trace"
import {
    FETCH_RETRY_DEFAULT,
    FETCH_RETRY_DEFAULT_DEFAULT,
    FETCH_RETRY_MAX_DELAY_DEFAULT,
} from "./constants"
import { errorMessage } from "./error"
import { toStringList } from "./util"

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
            const delay = Math.min(maxDelay, Math.pow(2, attempt) * retryDelay)
            trace?.resultItem(
                false,
                toStringList(
                    message,
                    `retry #${attempt + 1} in ${Math.floor(delay) / 1000}s`
                )
            )
            return delay
        },
    })
    return fetchRetry
}
