// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import pLimit from "p-limit";
import { runtimeHost } from "./host.js";
import { normalizeInt } from "./cleaners.js";
import { PROMISE_QUEUE_CONCURRENCY_DEFAULT } from "./constants.js";
/**
 * Creates or retrieves a concurrency-limited function for managing asynchronous operations.
 *
 * @param id - A unique identifier for the concurrency limiter.
 * @param concurrency - The maximum number of concurrent operations allowed.
 *                      Will be normalized to a minimum value of 1.
 * @returns A concurrency-limited function.
 */
export function concurrentLimit(id, concurrency) {
    concurrency = Math.max(1, normalizeInt(concurrency));
    let limit = runtimeHost.userState["limit:" + id];
    if (!limit) {
        limit = pLimit(concurrency);
        runtimeHost.userState["limit:" + id] = limit;
    }
    else if (limit.concurrency > 0)
        limit.concurrency = concurrency;
    return limit;
}
export class PLimitPromiseQueue {
    queue;
    constructor(concurrency) {
        const c = isNaN(concurrency) ? PROMISE_QUEUE_CONCURRENCY_DEFAULT : concurrency;
        this.queue = pLimit(Math.max(1, c));
    }
    async mapAll(values, fn, ...arguments_) {
        return await Promise.all(values.map((value) => this.queue(fn, value, ...arguments_)));
    }
    async all(fns) {
        return await Promise.all(fns.map((fn) => this.queue(fn)));
    }
    add(function_, ...arguments_) {
        const res = this.queue(function_, ...arguments_);
        return res;
    }
    clear() {
        this.queue.clearQueue();
    }
}
//# sourceMappingURL=concurrency.js.map