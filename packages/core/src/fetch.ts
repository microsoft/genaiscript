import crossFetch from "cross-fetch"
import wrapFetch from "fetch-retry"
import { TraceOptions } from "./trace"
import {
    FETCH_RETRY_DEFAULT,
    FETCH_RETRY_DEFAULT_DEFAULT,
    FETCH_RETRY_MAX_DELAY_DEFAULT,
} from "./constants"

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
    const fetchRetry = await wrapFetch(crossFetch, {
        retryOn,
        retries,
        retryDelay: (attempt, error, response) => {
            if (attempt > 0) trace?.item(`retry #${attempt}`)
            return Math.min(maxDelay, Math.pow(2, attempt) * retryDelay)
        },
    })
    return fetchRetry
}
