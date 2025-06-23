// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CancelError } from "./error.js";
import { logWarn } from "./util.js";

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
export class AbortSignalCancellationToken implements CancellationToken {
  // Constructor takes an AbortSignal to track cancellation
  constructor(private readonly signal: AbortSignal) {}

  // Accessor for checking if the cancellation has been requested
  get isCancellationRequested() {
    return this.signal.aborted;
  }
}

/**
 * Converts a CancellationToken to an AbortSignal if supported.
 * If the token lacks a compatible signal property, returns undefined.
 *
 * @param token - The CancellationToken to convert.
 * @returns The associated AbortSignal or undefined if unsupported.
 */
export function toSignal(token: CancellationToken) {
  return (token as any)?.signal as AbortSignal;
}

/**
 * A controller that manages the AbortSignal and its associated CancellationToken.
 * Useful for creating cancellable operations.
 */
export class AbortSignalCancellationController {
  readonly controller: AbortController;
  readonly token: AbortSignalCancellationToken;

  // Initializes the controller and creates a token with the associated signal
  constructor() {
    this.controller = new AbortController();
    this.token = new AbortSignalCancellationToken(this.controller.signal);
  }

  /**
   * Aborts the ongoing operation with an optional reason.
   * This triggers the cancellation state in the associated token.
   *
   * @param reason - Optional reason for aborting the operation.
   */
  abort(reason?: any) {
    this.controller.abort(reason);
  }
}

/**
 * Checks if the operation has been cancelled and throws an error if so.
 * Throws a CancelError when the cancellation is requested.
 *
 * @param token - The cancellation token to check.
 * @throws CancelError - If the cancellation has been requested.
 */
export function checkCancelled(token: CancellationToken) {
  if (token?.isCancellationRequested) throw new CancelError("user cancelled");
}

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
export function createCancellationController() {
  const canceller = new AbortSignalCancellationController();
  const cancelHandler = () => {
    logWarn("cancelling (cancel again to exit)...");
    canceller.abort();
    process.off("SIGINT", cancelHandler);
  };
  process.on("SIGINT", cancelHandler);
  return canceller;
}
