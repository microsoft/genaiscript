"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTRO_MIME_TYPE = exports.MARKDOWN_MIME_TYPE = exports.PYTHON_MIME_TYPE = exports.CSHARP_MIME_TYPE = exports.TYPESCRIPT_MIME_TYPE = exports.FSTAR_MIME_TYPE = void 0;
exports.lookupMime = lookupMime;
// Import the 'lookup' function from the 'mime-types' library and rename it to 'mimeTypesLookup'
const mime_1 = __importDefault(require("mime"));
const constants_js_1 = require("./constants.js");
// Define constant MIME types for specific programming languages
exports.FSTAR_MIME_TYPE = "text/x-fstar";
exports.TYPESCRIPT_MIME_TYPE = "text/x-typescript";
exports.CSHARP_MIME_TYPE = "text/x-csharp";
exports.PYTHON_MIME_TYPE = "text/x-python";
exports.MARKDOWN_MIME_TYPE = "text/markdown";
exports.ASTRO_MIME_TYPE = "text/x-astro";
// Define a function to look up the MIME type for a given filename
/**
 * Looks up the MIME type for a given filename.
 *
 * @param filename - The name of the file whose MIME type is to be determined.
 * @returns The corresponding MIME type string, or an empty string if not found.
 *
 * The function first checks for known file extensions for TypeScript, C#, Python, and Astro files.
 * If none match, it uses 'mimeTypesLookup' from the 'mime-types' library to find the MIME type.
 */
function lookupMime(filename) {
    if (!filename)
        return ""; // Return an empty string if the filename is falsy
    if (/\.m?ts$/i.test(filename))
        return exports.TYPESCRIPT_MIME_TYPE;
    if (/\.(c|m)?js$/i.test(filename))
        return constants_js_1.JAVASCRIPT_MIME_TYPE;
    if (/\.cs$/i.test(filename))
        return exports.CSHARP_MIME_TYPE;
    if (/\.py$/i.test(filename))
        return exports.PYTHON_MIME_TYPE;
    if (/\.astro$/i.test(filename))
        return exports.ASTRO_MIME_TYPE;
    if (/\.(md|prompty)$/i.test(filename))
        return exports.MARKDOWN_MIME_TYPE;
    if (/\.(fst|fsti)$/i.test(filename))
        return exports.FSTAR_MIME_TYPE;
    return mime_1.default.getType(filename) || "";
}
//# sourceMappingURL=mime.js.map