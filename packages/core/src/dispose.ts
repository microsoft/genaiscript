import { TraceOptions } from "./trace"
import { arrayify, logError } from "./util"

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
