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
     * This flag should be checked by operations to decide if they should terminate.
     */
    isCancellationRequested: boolean
}

export class AbortSignalCancellationToken implements CancellationToken {
    // Constructor takes an AbortSignal to track cancellation
    constructor(private readonly signal: AbortSignal) {}
    // Accessor for checking if the cancellation has been requested
    get isCancellationRequested() {
        return this.signal.aborted
    }
}

// Converts a CancellationToken to an AbortSignal if possible
export function toSignal(token: CancellationToken) {
    return (token as any)?.signal
}

export class AbortSignalCancellationController {
    readonly controller: AbortController
    readonly token: AbortSignalCancellationToken

    // Initializes the controller and creates a token with the associated signal
    constructor() {
        this.controller = new AbortController()
        this.token = new AbortSignalCancellationToken(this.controller.signal)
    }

    // Aborts the ongoing operation with an optional reason
    abort(reason?: any) {
        this.controller.abort(reason)
    }
}

// Checks if the operation has been cancelled and throws an error if so
export function checkCancelled(token: CancellationToken) {
    if (token?.isCancellationRequested) throw new CancelError("user cancelled")
}

// Represents optional cancellation behavior for an operation
export interface CancellationOptions {
    cancellationToken?: CancellationToken
}
