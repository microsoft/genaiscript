import crossFetch from "cross-fetch"
import wrapFetch from "fetch-retry"
import { MarkdownTrace, TraceOptions } from "./trace"

export async function createFetch(options?: {
    retryOn?: number[],
    retries?: number,
} & TraceOptions) {
    const { retries = 3, retryOn = [429, 500], trace } = options || {}
    const fetchRetry = await wrapFetch(crossFetch, {
        retryOn,
        retries,
        retryDelay: (attempt, error, response) => {
            if (attempt > 0) {
                trace?.item(`retry #${attempt}`)
            }
            return 0
        },
    })
    return fetchRetry
}