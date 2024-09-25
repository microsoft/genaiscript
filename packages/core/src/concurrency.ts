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

export class PLimitPromiseQueue implements PromiseQueue {
    private queue: LimitFunction
    constructor(private readonly options: PromiseQueueOptions) {
        this.queue = pLimit(options?.concurrency ?? 5)
    }

    add<Arguments extends unknown[], ReturnType>(
        function_: (
            ...arguments_: Arguments
        ) => PromiseLike<ReturnType> | ReturnType,
        ...arguments_: Arguments
    ): Promise<ReturnType> {
        const res = this.queue(function_, ...arguments_)
        return res
    }

    clear() {
        this.queue.clearQueue()
    }
}
