"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.indent = indent;
exports.dedent = dedent;
const ts_dedent_1 = require("ts-dedent");
/**
 * Indents each line of a given text by a specified indentation string.
 *
 * @param text - The input text to be indented. Returns the original text if it is undefined, null, or empty.
 * @param indentation - The string to prepend to each line of the input text.
 * @returns The indented text or the original input if it is undefined, null, or empty.
 */
function indent(text, indentation) {
    if (text === undefined || text === null || text === "")
        return text;
    return text
        ?.split(/\r?\n/g)
        .map((line) => indentation + line)
        .join("\n");
}
/**
 * Unindents a string.
 *
 * @param templ - Template or string to unindent.
 * @param values - Values to interpolate into the template.
 */
function dedent(templ, ...values) {
    if (templ === undefined)
        return undefined;
    if (templ === null)
        return null;
    return (0, ts_dedent_1.dedent)(templ, ...values);
}
//# sourceMappingURL=indent.js.map