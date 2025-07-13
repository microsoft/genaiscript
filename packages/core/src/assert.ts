// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("genaiscript:assert");

/**
 * Asserts a condition and throws an error if the condition is false.
 * Optionally logs an error message and debugging data to the console.
 *
 * @param cond - The condition to check. If false, the assertion fails.
 * @param msg - Optional. The error message to display if the assertion fails. Defaults to "Assertion failed".
 * @param debugData - Optional. Additional debugging data to log to the console if the assertion fails.
 *
 * Throws an Error when the condition is not met.
 * Triggers the debugger if enabled in the runtime environment.
 */
export function assert(
  cond: boolean,
  msg = "Assertion failed",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debugData?: any,
) {
  if (!cond) {
    if (debugData) {
      dbg("assertion failed, debug data: %O", debugData);
      console.error(msg || `assertion failed`, debugData);
    }
    // eslint-disable-next-line no-debugger
    debugger;
    throw new Error(msg);
  }
}
