import pLimit, { LimitFunction } from "p-limit"
import { runtimeHost } from "./host"
import { normalizeInt } from "./util"

export type ConcurrentLimitFunction = LimitFunction

export function concurrentLimit(
    id: string,
    concurrency: number
): ConcurrentLimitFunction {
    concurrency = Math.max(1, normalizeInt(concurrency))
    let limit = runtimeHost.userState["limit:" + id]
    if (!limit) {
        limit = pLimit(concurrency)
        runtimeHost.userState["limit:" + id] = limit
    } else if (limit.concurrency > 0) limit.concurrency = concurrency
    return limit
}
