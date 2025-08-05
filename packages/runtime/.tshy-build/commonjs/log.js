"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.info = info;
exports.debug = debug;
exports.warn = warn;
exports.error = error;
const node_console_1 = __importDefault(require("node:console"));
const core_1 = require("@genaiscript/core");
// This module provides logging functions with optional console color support
// Logging levels include info, debug, warn, and error
/**
 * Logs informational messages with optional color.
 * Combines string and number arguments into a single colored message if applicable.
 * Utilizes console.error to print to stderr.
 * @param args - The arguments to log
 */
function info(...args) {
    if (!core_1.isQuiet)
        node_console_1.default.error(...wrapArgs(core_1.CONSOLE_COLOR_INFO, args));
}
/**
 * Logs debug messages with optional color.
 * Suppresses output if 'isQuiet' is true.
 * Utilizes console.error to print to stderr.
 * Combines arguments into a single message if they are strings or numbers.
 * @param args - The arguments to log
 */
function debug(...args) {
    if (!core_1.isQuiet)
        node_console_1.default.error(...wrapArgs(core_1.CONSOLE_COLOR_DEBUG, args));
}
/**
 * Logs warning messages with optional color.
 * Combines string and number arguments into a single colored message if applicable.
 * Utilizes console.error to print to stderr.
 * @param args - The arguments to log
 */
function warn(...args) {
    node_console_1.default.error(...wrapArgs(core_1.CONSOLE_COLOR_WARNING, args));
}
/**
 * Logs error messages with optional color.
 * Utilizes console.error to print to stderr.
 * Combines string and number arguments into a single colored message if applicable.
 * @param args - The arguments to log
 */
function error(...args) {
    node_console_1.default.error(...wrapArgs(core_1.CONSOLE_COLOR_ERROR, args));
}
/**
 * Wraps arguments for logging, applying color if appropriate.
 * Combines string and number arguments into a single colored message.
 * @param color - The color code
 * @param args - The arguments to process
 * @returns An array with either color wrapped or original arguments
 */
function wrapArgs(color, args) {
    if (core_1.consoleColors && args.every((e) => typeof e === "string" || typeof e === "number")) {
        // if it's just strings & numbers use the coloring
        const msg = args.join(" ");
        return [(0, core_1.wrapColor)(color, msg)];
    }
    else {
        // otherwise use the console.log() etc built-in formatting
        return args;
    }
}
//# sourceMappingURL=log.js.map