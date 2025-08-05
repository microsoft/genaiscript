"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertThinkToMarkdown = convertThinkToMarkdown;
exports.unthink = unthink;
exports.splitThink = splitThink;
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
/**
 * Converts custom "think" tags within a string to Markdown format with collapsible HTML elements.
 *
 * @param md - The input string containing "think" tags to be converted.
 * @returns The string with "think" tags replaced by collapsible Markdown syntax. If the input is empty, returns the input as is.
 */
function convertThinkToMarkdown(md) {
    if (!md)
        return md;
    md = md.replace(constants_js_1.THINK_REGEX, (_, text, end) => {
        return `\n<details><summary>🤔 think${end === "</think>" ? "" : "ing..."}</summary>${text}</details>\n`;
    });
    return md;
}
/**
 * Removes all occurrences of THINK_REGEX matches from the given string.
 *
 * @param md - The string from which THINK_REGEX matches will be removed.
 *             If the input is null or empty, it is returned as is.
 * @returns The modified string with THINK_REGEX matches removed, or the original string if no matches are found.
 */
function unthink(md) {
    if (!md)
        return md;
    md = md.replace(constants_js_1.THINK_REGEX, "");
    return md;
}
/**
 * /**
 *  * Parses input text to separate main content and reasoning enclosed within `
 */
function splitThink(text) {
    const reasoning = [];
    const res = text?.replace(constants_js_1.THINK_REGEX, (_, text, end) => {
        reasoning.push(text);
        return "";
    });
    return (0, cleaners_js_1.deleteUndefinedValues)({
        content: res,
        reasoning: reasoning.length ? reasoning.join("\n") : undefined,
    });
}
//# sourceMappingURL=think.js.map