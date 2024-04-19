import crossFetch from "cross-fetch"
import wrapFetch from "fetch-retry"
import { TraceOptions } from "./trace"

export async function createFetch(
    options?: {
        retryOn?: number[]
        retries?: number
        retryDelay?: number
        maxDelay?: number
    } & TraceOptions
) {
    const {
        retries = 3,
        retryOn = [429, 500],
        trace,
        retryDelay = 10000,
        maxDelay = 60000,
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
