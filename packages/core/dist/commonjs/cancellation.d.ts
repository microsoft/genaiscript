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
    isCancellationRequested: boolean;
}
/**
 * Implements the CancellationToken using an AbortSignal
 * to track the cancellation state.
 */
export declare class AbortSignalCancellationToken implements CancellationToken {
    private readonly signal;
    constructor(signal: AbortSignal);
    get isCancellationRequested(): boolean;
}
/**
 * Converts a CancellationToken to an AbortSignal if supported.
 * If the token lacks a compatible signal property, returns undefined.
 *
 * @param token - The CancellationToken to convert.
 * @returns The associated AbortSignal or undefined if unsupported.
 */
export declare function toSignal(token: CancellationToken): AbortSignal;
/**
 * A controller that manages the AbortSignal and its associated CancellationToken.
 * Useful for creating cancellable operations.
 */
export declare class AbortSignalCancellationController {
    readonly controller: AbortController;
    readonly token: AbortSignalCancellationToken;
    constructor();
    /**
     * Aborts the ongoing operation with an optional reason.
     * This triggers the cancellation state in the associated token.
     *
     * @param reason - Optional reason for aborting the operation.
     */
    abort(reason?: any): void;
}
/**
 * Checks if the operation has been cancelled and throws an error if so.
 * Throws a CancelError when the cancellation is requested.
 *
 * @param token - The cancellation token to check.
 * @throws CancelError - If the cancellation has been requested.
 */
export declare function checkCancelled(token: CancellationToken): void;
/**
 * Represents optional cancellation behavior for an operation.
 * Contains a CancellationToken that can be checked for cancellation requests.
 */
export interface CancellationOptions {
    cancellationToken?: CancellationToken;
}
/**
 * Creates and returns an instance of AbortSignalCancellationController for handling cancellations.
 *
 * This function sets up a signal handler for SIGINT. On receiving the signal, it logs a warning,
 * aborts the cancellation controller, and removes the signal handler. Calling SIGINT again after
 * the first cancellation is invoked will exit the process.
 *
 * @returns An initialized AbortSignalCancellationController instance.
 */
export declare function createCancellationController(): AbortSignalCancellationController;
//# sourceMappingURL=cancellation.d.ts.map