"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispose = dispose;
const cleaners_js_1 = require("./cleaners.js");
const util_js_1 = require("./util.js");
/**
 * Disposes of the provided disposables by invoking their `Symbol.asyncDispose` method.
 *
 * @param disposables - A single disposable or an array of disposables to be released. Undefined values are ignored.
 * @param options - Configuration object containing trace utilities for logging errors.
 *
 * Logs errors encountered during disposal using `logError` and the provided trace's error method.
 */
async function dispose(disposables, options) {
    const { trace } = options || {};
    for (const disposable of (0, cleaners_js_1.arrayify)(disposables)) {
        if (typeof disposable === "object" && disposable[Symbol.asyncDispose]) {
            try {
                await disposable[Symbol.asyncDispose]();
            }
            catch (e) {
                (0, util_js_1.logError)(e);
                trace?.error(e);
            }
        }
    }
}
//# sourceMappingURL=dispose.js.map