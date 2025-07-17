import { isCancelError, serializeError } from "./error.js";
import { resolveRuntimeHost } from "./host.js";
import type { SerializedError } from "./types.js";
import { YAMLStringify } from "./yaml.js";

/**
 * Logs an informational message.
 *
 * @param msg - The message to log. Must be a string containing the information to log.
 */
export function logInfo(msg: string) {
  const runtimeHost = resolveRuntimeHost();
  runtimeHost.log("info", msg);
}

/**
 * Logs a verbose debug message using the host logging system.
 *
 * @param msg - The message to be logged at debug level.
 */
export function logVerbose(msg: string) {
  const runtimeHost = resolveRuntimeHost();
  runtimeHost.log("debug", msg);
}

/**
 * Logs a warning message to the host system's logger.
 *
 * @param msg - The warning message to log. Should be a descriptive string providing details about the warning.
 */
export function logWarn(msg: string) {
  const runtimeHost = resolveRuntimeHost();
  runtimeHost.log("warn", msg);
}

/**
 * Logs an error message with additional debug information if available.
 *
 * @param msg - The error message, error object, or serialized error to log.
 *              If the message indicates a cancellation, it is logged as a warning.
 *
 * Details:
 * - Extracts error details such as message, name, and stack from the error object.
 * - Logs the error message at "error" severity.
 * - Logs the stack trace and additional serialized error data at "debug" severity if present.
 * - If the error is a cancellation, logs the message at "warn" severity instead.
 */
export function logError(msg: string | Error | SerializedError) {
  const runtimeHost = resolveRuntimeHost();
  const err = serializeError(msg);
  const { message, name, stack, ...e } = err || {};
  if (isCancelError(err)) {
    runtimeHost.log("warn", message || "cancelled");
    return;
  }
  runtimeHost.log("error", message ?? name ?? "error");
  if (stack) runtimeHost.log("debug", stack);
  if (Object.keys(e).length) {
    const se = YAMLStringify(e);
    runtimeHost.log("debug", se);
  }
}
