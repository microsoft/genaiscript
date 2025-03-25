import { TraceOptions } from "./trace"
import { arrayify, logError } from "./util"

/**
 * Disposes of the provided async disposable resources.
 * Iterates through the disposables and calls their asyncDispose method.
 * Logs errors encountered during disposal using logError and trace.error.
 *
 * @param disposables - The async disposable resources to be disposed of.
 * @param options - Configuration options, including tracing functionality.
 */
export async function dispose(
    disposables: ElementOrArray<AsyncDisposable>,
    options: TraceOptions
) {
    const { trace } = options || {}
    for (const disposable of arrayify(disposables)) {
        if (disposable !== undefined && disposable[Symbol.asyncDispose]) {
            try {
                await disposable[Symbol.asyncDispose]()
            } catch (e) {
                logError(e)
                trace.error(e)
            }
        }
    }
}
