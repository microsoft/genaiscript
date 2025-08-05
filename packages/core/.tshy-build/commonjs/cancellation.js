"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbortSignalCancellationController = exports.AbortSignalCancellationToken = void 0;
exports.toSignal = toSignal;
exports.checkCancelled = checkCancelled;
exports.createCancellationController = createCancellationController;
const error_js_1 = require("./error.js");
const util_js_1 = require("./util.js");
/**
 * Implements the CancellationToken using an AbortSignal
 * to track the cancellation state.
 */
class AbortSignalCancellationToken {
    signal;
    // Constructor takes an AbortSignal to track cancellation
    constructor(signal) {
        this.signal = signal;
    }
    // Accessor for checking if the cancellation has been requested
    get isCancellationRequested() {
        return this.signal.aborted;
    }
}
exports.AbortSignalCancellationToken = AbortSignalCancellationToken;
/**
 * Converts a CancellationToken to an AbortSignal if supported.
 * If the token lacks a compatible signal property, returns undefined.
 *
 * @param token - The CancellationToken to convert.
 * @returns The associated AbortSignal or undefined if unsupported.
 */
function toSignal(token) {
    return token?.signal;
}
/**
 * A controller that manages the AbortSignal and its associated CancellationToken.
 * Useful for creating cancellable operations.
 */
class AbortSignalCancellationController {
    controller;
    token;
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
    abort(reason) {
        this.controller.abort(reason);
    }
}
exports.AbortSignalCancellationController = AbortSignalCancellationController;
/**
 * Checks if the operation has been cancelled and throws an error if so.
 * Throws a CancelError when the cancellation is requested.
 *
 * @param token - The cancellation token to check.
 * @throws CancelError - If the cancellation has been requested.
 */
function checkCancelled(token) {
    if (token?.isCancellationRequested)
        throw new error_js_1.CancelError("user cancelled");
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
function createCancellationController() {
    const canceller = new AbortSignalCancellationController();
    const cancelHandler = () => {
        (0, util_js_1.logWarn)("cancelling (cancel again to exit)...");
        canceller.abort();
        process.off("SIGINT", cancelHandler);
    };
    process.on("SIGINT", cancelHandler);
    return canceller;
}
//# sourceMappingURL=cancellation.js.map