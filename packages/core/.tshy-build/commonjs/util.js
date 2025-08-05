"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strcmp = strcmp;
exports.toArray = toArray;
exports.toStringList = toStringList;
exports.collapseEmptyLines = collapseEmptyLines;
exports.concatBuffers = concatBuffers;
exports.toHex = toHex;
exports.fromHex = fromHex;
exports.relativePath = relativePath;
exports.concatArrays = concatArrays;
exports.groupBy = groupBy;
exports.ellipse = ellipse;
exports.ellipseLast = ellipseLast;
const constants_js_1 = require("./constants.js");
const host_js_1 = require("./host.js");
__exportStar(require("./log.js"), exports);
/**
 * Compares two strings lexicographically.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns 0 if the strings are equal, -1 if the first string is less than the second,
 *          and 1 if the first string is greater than the second.
 */
function strcmp(a, b) {
    if (a === b)
        return 0;
    if (a < b)
        return -1;
    else
        return 1;
}
/**
 * Converts an array-like object into an array.
 *
 * @param a - The array-like object to convert. If null or undefined, it returns undefined.
 * @returns An array containing all elements from the input array-like object in the same order. If the input is null or undefined, it returns undefined.
 */
function toArray(a) {
    if (!a)
        return undefined;
    const r = new Array(a.length);
    for (let i = 0; i < a.length; ++i)
        r[i] = a[i];
    return r;
}
/**
 * Converts a list of strings into a single comma-separated string.
 *
 * @param token - An array of strings to be processed. Empty, null, or undefined strings are ignored.
 * @returns A single string with valid input strings concatenated and separated by commas.
 */
function toStringList(...token) {
    const md = token.filter((l) => l !== undefined && l !== null && l !== "").join(", ");
    return md;
}
/**
 * Collapses consecutive empty lines in a given text to a maximum of one.
 *
 * @param text - The input text to process. Can be undefined or null.
 * @returns The modified text where multiple consecutive empty lines are reduced to a single empty line. If the input is undefined or null, it returns the input as is.
 */
function collapseEmptyLines(text) {
    return text?.replace(/(\r?\n){2,}/g, "\n\n");
}
/**
 * Concatenates multiple binary data chunks into a single buffer.
 *
 * @param chunks - A variable number of binary-like objects to be concatenated.
 *                 Each chunk must have a `length` property and support indexed access.
 * @returns A single buffer containing the combined data from all input chunks.
 */
function concatBuffers(...chunks) {
    let sz = 0;
    for (const ch of chunks)
        sz += ch.length;
    const r = new Uint8Array(sz);
    sz = 0;
    for (const ch of chunks) {
        r.set(ch, sz);
        sz += ch.length;
    }
    return r;
}
/**
 * Converts an array-like sequence of bytes into a hexadecimal string representation.
 *
 * @param bytes - An array-like object containing byte values to be converted.
 * @param sep - An optional separator to insert between hexadecimal byte pairs.
 * @returns A string containing the hexadecimal representation of the input bytes,
 *          separated by the specified separator (if provided), or undefined if the input is invalid.
 */
function toHex(bytes, sep) {
    if (!bytes)
        return undefined;
    let r = "";
    for (let i = 0; i < bytes.length; ++i) {
        if (sep && i > 0)
            r += sep;
        r += ("0" + bytes[i].toString(16)).slice(-2);
    }
    return r;
}
/**
 * Converts a hexadecimal string into a Uint8Array.
 *
 * @param hex - The hexadecimal string to be converted. Each pair of characters corresponds to a byte.
 * @returns A Uint8Array representing the bytes derived from the hexadecimal string.
 */
function fromHex(hex) {
    const r = new Uint8Array(hex.length >> 1);
    for (let i = 0; i < hex.length; i += 2)
        r[i >> 1] = parseInt(hex.slice(i, i + 2), 16);
    return r;
}
/**
 * Resolves a file path relative to a specified root path.
 *
 * @param root The root directory to resolve the relative path against.
 * @param fn The file path to resolve. If it's empty, null, undefined, or matches a URL pattern, it is returned unmodified.
 * @returns The relative file path if it is within the root directory, otherwise the original file path.
 */
function relativePath(root, fn) {
    // ignore empty path or urls
    if (!fn || constants_js_1.HTTPS_REGEX.test(fn))
        return fn;
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const afn = runtimeHost.path.resolve(fn);
    if (afn.startsWith(root)) {
        return afn.slice(root.length).replace(/^[/\\]+/, "");
    }
    return fn;
}
/**
 * Concatenates multiple arrays into a single array.
 *
 * @param arrays - A variable number of arrays to concatenate.
 * @returns A single array containing all elements from the input arrays in order.
 */
function concatArrays(...arrays) {
    if (arrays.length === 0)
        return [];
    return arrays[0].concat(...arrays.slice(1));
}
/**
 * Groups elements of a list into a record based on a key-generating function.
 *
 * @param list - The array of elements to group. If null or undefined, returns an empty record.
 * @param key - A function that generates a key for each element in the list. Elements with the same key are grouped together.
 * @returns A record where each key corresponds to a grouped array of elements.
 */
function groupBy(list, key) {
    if (!list)
        return {};
    const r = {};
    list.forEach((item) => {
        const k = key(item);
        const a = r[k] || (r[k] = []);
        a.push(item);
    });
    return r;
}
/**
 * Truncates the input text to a specified length and appends an ellipsis if the text exceeds the length.
 *
 * @param text - The input string to be truncated.
 * @param length - The maximum allowed length of the output string, including the ellipsis.
 * @returns The truncated string with an ellipsis appended if it exceeds the specified length.
 */
function ellipse(text, length) {
    if (text?.length > length)
        return text.slice(0, length - 1) + "…";
    else
        return text;
}
/**
 * Truncates the beginning of a string if it exceeds the specified length and adds an ellipsis at the beginning.
 *
 * @param text - The input string to process. Can be undefined or null.
 * @param length - The maximum allowed length of the string including the ellipsis.
 * @returns The processed string with an ellipsis at the start if it exceeds the specified length, or the original string if it does not.
 */
function ellipseLast(text, length) {
    if (text?.length > length)
        return "…" + text.slice(length - text.length + 1);
    else
        return text;
}
//# sourceMappingURL=util.js.map