"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.dotEnvParse = void 0;
exports.dotEnvTryParse = dotEnvTryParse;
exports.dotEnvStringify = dotEnvStringify;
// This module provides utilities for parsing and stringifying dotenv-style files.
// It includes functions to handle parsing errors gracefully and formatting key-value pairs properly.
// Tags: dotenv, parsing, error handling
// Import the 'parse' function from the 'dotenv' library to parse dotenv files
const dotenv_1 = require("dotenv");
// Import a local utility function 'logError' for logging errors
const util_js_1 = require("./util.js");
/**
 * Safely parses a dotenv-style string into a key-value object.
 * If parsing fails, logs the error and returns an empty object.
 *
 * @param text - The dotenv file content as a string
 * @returns A record with key-value pairs from the dotenv file
 */
function dotEnvTryParse(text) {
    try {
        // Try parsing the text using the 'parse' function
        return (0, dotenv_1.parse)(text);
    }
    catch (e) {
        // Log any parsing error encountered
        (0, util_js_1.logError)(e);
        // Return an empty object to indicate parsing failure
        return {};
    }
}
// Export the 'parse' function directly so it can be used externally
exports.dotEnvParse = dotenv_1.parse;
/**
 * Converts a key-value record into a dotenv-style string.
 * If values contain newlines or quotes, they are enclosed in double quotes and escaped.
 *
 * @param record - An object representing key-value pairs
 * @returns A dotenv-formatted string
 */
function dotEnvStringify(record) {
    return (Object.entries(record || {})
        .map(([key, value]) => {
        // Ensure null or undefined values are treated as empty strings
        if (value === undefined || value === null)
            value = "";
        // Enclose in quotes if the value contains newlines or quotes, and escape quotes
        if (value.includes("\n") || value.includes('"')) {
            value = value.replace(/"/g, '\\"'); // Escape existing quotes
            return `${key}="${value}"`;
        }
        // Default key-value format without quotes
        return `${key}=${value}`;
    })
        // Join all key-value pairs with newline characters for dotenv format
        .join("\n"));
}
//# sourceMappingURL=dotenv.js.map