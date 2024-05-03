import { CancelError } from "./error"

/**
 * A cancellation token is passed to an asynchronous or long running
 * operation to request cancellation, like cancelling a request
 * for completion items because the user continued to type.
 *
 * To get an instance of a `CancellationToken` use a
 * {@link CancellationTokenSource}.
 */
export interface CancellationToken {
    /**
     * Is `true` when the token has been cancelled, `false` otherwise.
     */
    isCancellationRequested: boolean
}

export class AbortSignalCancellationToken implements CancellationToken {
    constructor(private readonly signal: AbortSignal) {}
    get isCancellationRequested() {
        return this.signal.aborted
    }
}

export function checkCancelled(token: CancellationToken) {
    if (token?.isCancellationRequested) throw new CancelError("user cancelled")
}
