// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { LOG } from "./constants.js";
import { genaiscriptDebug } from "./debug.js";
import { resolveGlobal } from "./global.js";
const dbg = genaiscriptDebug("host");
export class LogEvent extends Event {
    level;
    message;
    static Name = "log";
    constructor(level, message) {
        super(LOG);
        this.level = level;
        this.message = message;
    }
}
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
export function isAzureTokenExpired(token) {
    // Consider the token expired 5 seconds before the actual expiration to avoid timing issues
    return !token || token.expiresOnTimestamp < Date.now() - 5_000;
}
export function resolveRuntimeHost() {
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
export function setRuntimeHost(h) {
    dbg(`set runtime host`);
    globalThis.genaiscript = h;
}
export function checkRuntime() {
    if (typeof resolveGlobal().env === "undefined") {
        dbg(`attempt to access uninitialized runtime host`);
        throw new Error("Runtime not initialized, https://microsoft.github.io/genaiscript/reference/runtime/.");
    }
}
//# sourceMappingURL=host.js.map