"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkString = chunkString;
exports.chunkLines = chunkLines;
const assert_js_1 = require("./assert.js");
/**
 * Splits a string into chunks of specified size.
 * Parameters:
 * - s: Input string to split. Must be non-null and non-empty.
 * - n: Maximum size of each chunk. Defaults to 2 << 14.
 * Returns:
 * - Array of string chunks. Each chunk's length is <= n.
 */
function chunkString(s, n = 2 << 14) {
    if (!s?.length)
        return [];
    if (s.length <= n)
        return [s];
    const r = [];
    for (let i = 0; i < s.length; i += n) {
        r.push(s.slice(i, i + n));
        (0, assert_js_1.assert)(r[r.length - 1].length <= n);
    }
    return r;
}
/**
 * Splits a string into chunks of lines, ensuring each chunk's size does not exceed the specified limit.
 *
 * @param s - Input string to split. Must be non-null and non-empty.
 * @param n - Maximum size of each chunk in characters. Defaults to 2 << 14.
 * @returns Array of string chunks, where each chunk consists of complete lines and has a size <= n.
 */
function chunkLines(s, n = 2 << 14) {
    if (!s?.length)
        return [];
    if (s.length <= n)
        return [s];
    const r = [""];
    const lines = s.split(/\r?\n/);
    for (const line of lines) {
        if (r[r.length - 1].length + line.length > n)
            r.push("");
        r[r.length - 1] += line + "\n";
    }
    return r;
}
//# sourceMappingURL=chunkers.js.map