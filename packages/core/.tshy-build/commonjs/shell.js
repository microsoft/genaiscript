"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.shellParse = shellParse;
exports.shellQuote = shellQuote;
exports.shellRemoveAsciiColors = shellRemoveAsciiColors;
const shell_quote_1 = require("shell-quote");
/**
 * Parses a shell command into an array of arguments.
 *
 * @param cmd - The shell command string to be parsed.
 * @returns An array of arguments, excluding comments. For non-string elements,
 *          it resolves operation types (e.g., globs or operators) and includes them in the result.
 */
function shellParse(cmd) {
    const args = (0, shell_quote_1.parse)(cmd);
    const res = args
        .filter((e) => !e.comment)
        .map((e) => typeof e === "string" ? e : e.op === "glob" ? e.pattern : e.op);
    return res;
}
/**
 * Quotes an array of strings for safe use in a shell command.
 *
 * @param args - An array of strings representing the components of a shell command.
 *               Each string will be quoted as necessary to ensure it is interpreted correctly by the shell.
 * @returns A single string where the input arguments are properly quoted for shell usage.
 */
function shellQuote(args) {
    return (0, shell_quote_1.quote)(args);
}
/**
 * Removes ANSI escape codes used for ASCII colors from a given string.
 *
 * @param text - The input string containing potential ANSI color codes.
 * @returns The string with ANSI color codes removed.
 */
function shellRemoveAsciiColors(text) {
    return text?.replace(/\x1b\[[0-9;]*m/g, ""); // ascii colors
}
//# sourceMappingURL=shell.js.map