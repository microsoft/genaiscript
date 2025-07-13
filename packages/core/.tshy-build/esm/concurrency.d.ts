import { LimitFunction } from "p-limit";
import type { Awaitable, PromiseQueue } from "./types.js";
export type ConcurrentLimitFunction = LimitFunction;
/**
 * Creates or retrieves a concurrency-limited function for managing asynchronous operations.
 *
 * @param id - A unique identifier for the concurrency limiter.
 * @param concurrency - The maximum number of concurrent operations allowed.
 *                      Will be normalized to a minimum value of 1.
 * @returns A concurrency-limited function.
 */
export declare function concurrentLimit(id: string, concurrency: number): ConcurrentLimitFunction;
export declare class PLimitPromiseQueue implements PromiseQueue {
    private queue;
    constructor(concurrency?: number);
    mapAll<T extends unknown, Arguments extends unknown[], ReturnType>(values: T[], fn: (value: T, ...arguments_: Arguments) => Awaitable<ReturnType>, ...arguments_: Arguments): Promise<ReturnType[]>;
    all<T = any>(fns: (() => Awaitable<T>)[]): Promise<T[]>;
    add<Arguments extends unknown[], ReturnType>(function_: (...arguments_: Arguments) => PromiseLike<ReturnType> | ReturnType, ...arguments_: Arguments): Promise<ReturnType>;
    clear(): void;
}
//# sourceMappingURL=concurrency.d.ts.map