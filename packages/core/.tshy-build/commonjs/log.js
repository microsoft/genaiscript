"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInfo = logInfo;
exports.logVerbose = logVerbose;
exports.logWarn = logWarn;
exports.logError = logError;
const error_js_1 = require("./error.js");
const host_js_1 = require("./host.js");
const yaml_js_1 = require("./yaml.js");
/**
 * Logs an informational message.
 *
 * @param msg - The message to log. Must be a string containing the information to log.
 */
function logInfo(msg) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    runtimeHost.log("info", msg);
}
/**
 * Logs a verbose debug message using the host logging system.
 *
 * @param msg - The message to be logged at debug level.
 */
function logVerbose(msg) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    runtimeHost.log("debug", msg);
}
/**
 * Logs a warning message to the host system's logger.
 *
 * @param msg - The warning message to log. Should be a descriptive string providing details about the warning.
 */
function logWarn(msg) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
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
function logError(msg) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const err = (0, error_js_1.serializeError)(msg);
    const { message, name, stack, ...e } = err || {};
    if ((0, error_js_1.isCancelError)(err)) {
        runtimeHost.log("warn", message || "cancelled");
        return;
    }
    runtimeHost.log("error", message ?? name ?? "error");
    if (stack)
        runtimeHost.log("debug", stack);
    if (Object.keys(e).length) {
        const se = (0, yaml_js_1.YAMLStringify)(e);
        runtimeHost.log("debug", se);
    }
}
//# sourceMappingURL=log.js.map