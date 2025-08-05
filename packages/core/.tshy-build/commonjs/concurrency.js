"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLimitPromiseQueue = void 0;
exports.concurrentLimit = concurrentLimit;
const p_limit_1 = __importDefault(require("p-limit"));
const host_js_1 = require("./host.js");
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
/**
 * Creates or retrieves a concurrency-limited function for managing asynchronous operations.
 *
 * @param id - A unique identifier for the concurrency limiter.
 * @param concurrency - The maximum number of concurrent operations allowed.
 *                      Will be normalized to a minimum value of 1.
 * @returns A concurrency-limited function.
 */
function concurrentLimit(id, concurrency) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    concurrency = Math.max(1, (0, cleaners_js_1.normalizeInt)(concurrency));
    let limit = runtimeHost.userState["limit:" + id];
    if (!limit) {
        limit = (0, p_limit_1.default)(concurrency);
        runtimeHost.userState["limit:" + id] = limit;
    }
    else if (limit.concurrency > 0)
        limit.concurrency = concurrency;
    return limit;
}
class PLimitPromiseQueue {
    queue;
    constructor(concurrency) {
        const c = isNaN(concurrency) ? constants_js_1.PROMISE_QUEUE_CONCURRENCY_DEFAULT : concurrency;
        this.queue = (0, p_limit_1.default)(Math.max(1, c));
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
exports.PLimitPromiseQueue = PLimitPromiseQueue;
//# sourceMappingURL=concurrency.js.map