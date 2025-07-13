// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import pLimit, { LimitFunction } from "p-limit";
import { runtimeHost } from "./host.js";
import { normalizeInt } from "./cleaners.js";
import { PROMISE_QUEUE_CONCURRENCY_DEFAULT } from "./constants.js";
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
export function concurrentLimit(id: string, concurrency: number): ConcurrentLimitFunction {
  concurrency = Math.max(1, normalizeInt(concurrency));
  let limit = runtimeHost.userState["limit:" + id] as LimitFunction;
  if (!limit) {
    limit = pLimit(concurrency);
    runtimeHost.userState["limit:" + id] = limit;
  } else if (limit.concurrency > 0) limit.concurrency = concurrency;
  return limit;
}

export class PLimitPromiseQueue implements PromiseQueue {
  private queue: LimitFunction;
  constructor(concurrency?: number) {
    const c = isNaN(concurrency) ? PROMISE_QUEUE_CONCURRENCY_DEFAULT : concurrency;
    this.queue = pLimit(Math.max(1, c));
  }

  async mapAll<T extends unknown, Arguments extends unknown[], ReturnType>(
    values: T[],
    fn: (value: T, ...arguments_: Arguments) => Awaitable<ReturnType>,
    ...arguments_: Arguments
  ): Promise<ReturnType[]> {
    return await Promise.all(values.map((value) => this.queue(fn, value, ...arguments_)));
  }

  async all<T = any>(fns: (() => Awaitable<T>)[]): Promise<T[]> {
    return await Promise.all(fns.map((fn) => this.queue(fn)));
  }

  add<Arguments extends unknown[], ReturnType>(
    function_: (...arguments_: Arguments) => PromiseLike<ReturnType> | ReturnType,
    ...arguments_: Arguments
  ): Promise<ReturnType> {
    const res = this.queue(function_, ...arguments_);
    return res;
  }

  clear() {
    this.queue.clearQueue();
  }
}
