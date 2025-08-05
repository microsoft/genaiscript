"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettifyMarkdown = prettifyMarkdown;
exports.prettyTokensPerSecond = prettyTokensPerSecond;
exports.prettyTokens = prettyTokens;
exports.prettyParenthesized = prettyParenthesized;
exports.prettyDuration = prettyDuration;
exports.prettyCost = prettyCost;
exports.prettyBytes = prettyBytes;
exports.prettyStrings = prettyStrings;
exports.prettyValue = prettyValue;
exports.prettyTemperature = prettyTemperature;
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const constants_js_1 = require("./constants.js");
const precision_js_1 = require("./precision.js");
const unwrappers_js_1 = require("./unwrappers.js");
const annotations_js_1 = require("./annotations.js");
const think_js_1 = require("./think.js");
const cleaners_js_1 = require("./cleaners.js");
/**
 * Prettifies markdown content by converting annotations to markdown, processing "think" blocks, and collapsing excessive newlines.
 * @param md - The markdown string to prettify.
 * @returns The cleaned and formatted markdown string.
 */
function prettifyMarkdown(md) {
    let res = (0, unwrappers_js_1.unfence)(md, ["markdown", "md", "text"]);
    res = (0, annotations_js_1.convertAnnotationsToMarkdown)(res); // Convert annotations to markdown format
    res = (0, think_js_1.convertThinkToMarkdown)(res);
    res = (0, cleaners_js_1.collapseNewlines)(res); // Clean up excessive newlines
    return res;
}
/**
 * Formats token usage into a human-readable string indicating tokens per second.
 *
 * @param usage - Object containing usage data. Must include:
 *   - `total_tokens`: The total number of tokens used.
 *   - `duration`: The duration of usage in milliseconds.
 * @returns A string representing tokens per second, formatted as "X.XXt/s", or an empty string if input is invalid.
 */
function prettyTokensPerSecond(usage) {
    if (!usage || !usage.duration || !usage.total_tokens)
        return "";
    return `${(usage.total_tokens / (usage.duration / 1000)).toFixed(2)}t/s`;
}
/**
 * Converts a numeric token count into a human-readable string with units.
 *
 * @param n - The number of tokens to format. If not a valid number, returns an empty string.
 * @param direction - Optional indicator for token type:
 *   "prompt" for input tokens (adds "↑" as prefix) or
 *   "completion" for output tokens (adds "↓" as prefix). Defaults to no prefix.
 * @returns A formatted string with units "t" for tokens, "kt" for kilo-tokens, or "Mt" for mega-tokens.
 */
function prettyTokens(n, direction) {
    if (isNaN(n))
        return "";
    const prefix = direction === "both"
        ? constants_js_1.CHAR_UP_DOWN_ARROWS
        : direction === "prompt"
            ? constants_js_1.CHAR_UP_ARROW
            : direction === "completion"
                ? constants_js_1.CHAR_DOWN_ARROW
                : "";
    if (n < 1000)
        return `${prefix}${n.toString()}t`;
    if (n < 1e6)
        return `${prefix}${(n / 1e3).toFixed(1)}kt`;
    return `${prefix}${(n / 1e6).toFixed(1)}Mt`;
}
function prettyParenthesized(value) {
    return value !== undefined ? `(${value})` : "";
}
/**
 * Formats a duration in milliseconds into a human-readable string.
 *
 * @param ms - The duration in milliseconds to format.
 *   - Below 10,000ms: Returns as milliseconds with ceiling applied.
 *   - Between 10,000ms and 60,000ms: Converts to seconds with one decimal.
 *   - Between 60,000ms and 3,600,000ms: Converts to minutes with one decimal.
 *   - Above 3,600,000ms: Converts to hours with one decimal.
 * @returns A formatted string representing the duration.
 */
function prettyDuration(ms) {
    if (isNaN(ms))
        return "";
    const prefix = "";
    if (ms < 10000)
        return `${prefix}${Math.ceil(ms)}ms`;
    if (ms < 60 * 1000)
        return `${prefix}${(ms / 1000).toFixed(1)}s`;
    if (ms < 60 * 60 * 1000)
        return `${prefix}${(ms / 60 / 1000).toFixed(1)}m`;
    return `${prefix}${(ms / 60 / 60 / 1000).toFixed(1)}h`;
}
/**
 * Formats a numeric cost as a string for display.
 *
 * @param value - The numeric cost to format. Must be a non-negative number.
 * @returns The formatted cost as a string, using cents or dollars.
 */
function prettyCost(value) {
    if (!value || isNaN(value))
        return "";
    return value <= 0.01
        ? `${(value * 100).toFixed(3)}¢`
        : value <= 0.1
            ? `${(value * 100).toFixed(2)}¢`
            : `${value.toFixed(2)}$`;
}
/**
 * Converts a value representing bytes into a human-readable string.
 * Utilizes the `pretty-bytes` library for formatting.
 *
 * @param bytes - The numeric value to be converted, representing bytes.
 *                 If not a valid number, an empty string is returned.
 * @returns A human-readable string representing the byte value,
 *          e.g., "1.2 kB", "3 MB". Returns an empty string for invalid input.
 */
function prettyBytes(bytes) {
    if (isNaN(bytes))
        return "";
    return (0, pretty_bytes_1.default)(bytes);
}
/**
 * Converts a list of strings into a single comma-separated string.
 *
 * @param token - An array of strings to be processed. Empty, null, or undefined strings are ignored.
 * @returns A single string with valid input strings concatenated and separated by commas.
 */
function prettyStrings(...token) {
    const md = token.filter((l) => l !== undefined && l !== null && l !== "").join(", ");
    return md;
}
function prettyValue(value, options) {
    if (isNaN(value))
        return "";
    const { emoji = "", afterEmoji = "", precision = 2 } = options || {};
    const v = (0, precision_js_1.roundWithPrecision)(value, precision);
    const s = `${emoji}${v}${afterEmoji}`;
    return s;
}
function prettyTemperature(value) {
    return prettyValue(value, { afterEmoji: constants_js_1.CHAR_TEMPERATURE, precision: 1 });
}
//# sourceMappingURL=pretty.js.map