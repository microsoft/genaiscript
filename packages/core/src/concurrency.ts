import pLimit, { LimitFunction } from "p-limit"
import { runtimeHost } from "./host"
import { normalizeInt } from "./cleaners"
import { PROMISE_QUEUE_CONCURRENCY_DEFAULT } from "./constants"

export type ConcurrentLimitFunction = LimitFunction

/**
 * Creates a concurrent limit function for managing the execution of asynchronous tasks.
 * 
 * This function checks the current concurrency limit for a given ID in the user state. 
 * If no limit exists, it creates a new limit function with the specified concurrency. 
 * If a limit already exists and the current concurrency is greater than zero, it updates 
 * the concurrency to the new value. 
 * 
 * @param id - Unique identifier for the concurrency limit.
 * @param concurrency - The desired concurrency level for the limit function.
 * @returns A limit function that can be used to ensure the specified level of concurrency.
 */
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
    constructor(concurrency?: number) {
        const c = isNaN(concurrency)
            ? PROMISE_QUEUE_CONCURRENCY_DEFAULT
            : concurrency
        this.queue = pLimit(Math.max(1, c))
    }

    async mapAll<T extends unknown, Arguments extends unknown[], ReturnType>(
        values: T[],
        fn: (value: T, ...arguments_: Arguments) => Awaitable<ReturnType>,
        ...arguments_: Arguments
    ): Promise<ReturnType[]> {
        return await Promise.all(
            values.map((value) => this.queue(fn, value, ...arguments_))
        )
    }

    async all<T = any>(fns: (() => Awaitable<T>)[]): Promise<T[]> {
        return await Promise.all(fns.map((fn) => this.queue(fn)))
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
