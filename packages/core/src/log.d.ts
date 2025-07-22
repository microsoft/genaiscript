import type { SerializedError } from "./types.js";
/**
 * Logs an informational message.
 *
 * @param msg - The message to log. Must be a string containing the information to log.
 */
export declare function logInfo(msg: string): void;
/**
 * Logs a verbose debug message using the host logging system.
 *
 * @param msg - The message to be logged at debug level.
 */
export declare function logVerbose(msg: string): void;
/**
 * Logs a warning message to the host system's logger.
 *
 * @param msg - The warning message to log. Should be a descriptive string providing details about the warning.
 */
export declare function logWarn(msg: string): void;
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
export declare function logError(msg: string | Error | SerializedError): void;
//# sourceMappingURL=log.d.ts.map