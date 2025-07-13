// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TraceOptions } from "./trace.js";
import { arrayify } from "./cleaners.js";
import { logError } from "./util.js";
import type { ElementOrArray } from "./types.js";

/**
 * Disposes of the provided disposables by invoking their `Symbol.asyncDispose` method.
 *
 * @param disposables - A single disposable or an array of disposables to be released. Undefined values are ignored.
 * @param options - Configuration object containing trace utilities for logging errors.
 *
 * Logs errors encountered during disposal using `logError` and the provided trace's error method.
 */
export async function dispose(disposables: ElementOrArray<AsyncDisposable>, options: TraceOptions) {
  const { trace } = options || {};
  for (const disposable of arrayify(disposables)) {
    if (disposable !== undefined && disposable[Symbol.asyncDispose]) {
      try {
        await disposable[Symbol.asyncDispose]();
      } catch (e) {
        logError(e);
        trace?.error(e);
      }
    }
  }
}
