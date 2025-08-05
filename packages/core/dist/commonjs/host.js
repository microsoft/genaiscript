"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogEvent = void 0;
exports.isAzureTokenExpired = isAzureTokenExpired;
exports.resolveRuntimeHost = resolveRuntimeHost;
exports.setRuntimeHost = setRuntimeHost;
exports.checkRuntime = checkRuntime;
const constants_js_1 = require("./constants.js");
const debug_js_1 = require("./debug.js");
const global_js_1 = require("./global.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("host");
class LogEvent extends Event {
    level;
    message;
    static Name = "log";
    constructor(level, message) {
        super(constants_js_1.LOG);
        this.level = level;
        this.message = message;
    }
}
exports.LogEvent = LogEvent;
/**
 * Determines whether an Azure authentication token has expired.
 *
 * @param token - The authentication token to check. Contains the token string, expiration timestamp, and credential object.
 *                If null or undefined, the token is considered expired.
 * @returns True if the token is expired or invalid; false otherwise.
 *
 * Note: The function considers a token expired if its expiration timestamp is within 5 seconds
 * of the current time, to account for potential timing discrepancies.
 */
function isAzureTokenExpired(token) {
    // Consider the token expired 5 seconds before the actual expiration to avoid timing issues
    return !token || token.expiresOnTimestamp < Date.now() - 5_000;
}
function resolveRuntimeHost() {
    const h = globalThis.genaiscript;
    if (!h)
        throw new Error("GenAIScript runtime not initialized");
    return h;
}
/**
 * Sets the runtime host instance and updates the global host reference.
 *
 * @param h - An instance of RuntimeHost representing the runtime host to be set.
 *            This will also update the `host` to refer to the same instance.
 */
function setRuntimeHost(h) {
    dbg(`set runtime host`);
    globalThis.genaiscript = h;
}
function checkRuntime() {
    if (typeof (0, global_js_1.resolveGlobal)().env === "undefined") {
        dbg(`attempt to access uninitialized runtime host`);
        throw new Error("Runtime not initialized, https://microsoft.github.io/genaiscript/reference/runtime/.");
    }
}
//# sourceMappingURL=host.js.map