import { TraceOptions } from "./trace.js";
import type { ElementOrArray } from "./types.js";
/**
 * Disposes of the provided disposables by invoking their `Symbol.asyncDispose` method.
 *
 * @param disposables - A single disposable or an array of disposables to be released. Undefined values are ignored.
 * @param options - Configuration object containing trace utilities for logging errors.
 *
 * Logs errors encountered during disposal using `logError` and the provided trace's error method.
 */
export declare function dispose(disposables: ElementOrArray<AsyncDisposable>, options?: TraceOptions): Promise<void>;
//# sourceMappingURL=dispose.d.ts.map