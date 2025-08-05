"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.INIParse = INIParse;
exports.INITryParse = INITryParse;
exports.INIStringify = INIStringify;
// This module provides functions to parse and stringify INI formatted strings,
// with error handling and utility support for cleaning up the input content.
// Import the parse and stringify functions from the "ini" library
const ini_1 = require("ini");
// Import a utility function to log errors
const util_js_1 = require("./util.js");
// Import a custom function to clean up INI content by removing any fencing
const unwrappers_js_1 = require("./unwrappers.js");
const unwrappers_js_2 = require("./unwrappers.js");
/**
 * Parses an INI formatted string after cleaning it by removing fencing and resolving file content.
 *
 * @param text - INI formatted string or file content to process
 * @returns Parsed object
 */
function INIParse(text) {
    text = (0, unwrappers_js_2.filenameOrFileToContent)(text);
    const cleaned = (0, unwrappers_js_1.unfence)(text, "ini"); // Remove any fencing from the text
    return (0, ini_1.parse)(cleaned); // Parse the cleaned text into an object
}
/**
 * Parses an INI formatted string, logs errors if parsing fails, and returns a default value.
 *
 * @param text - The INI formatted string or file content to parse
 * @param defaultValue - The value to return if parsing fails
 * @returns The parsed object or the default value
 */
function INITryParse(text, defaultValue) {
    try {
        return INIParse(text); // Attempt to parse the text
    }
    catch (e) {
        (0, util_js_1.logError)(e); // Log any parsing errors
        return defaultValue; // Return the default value if parsing fails
    }
}
/**
 * Converts an object into an INI formatted string.
 *
 * @param o - The object to stringify
 * @returns The INI formatted string
 */
function INIStringify(o) {
    return (0, ini_1.stringify)(o); // Convert the object to an INI formatted string
}
//# sourceMappingURL=ini.js.map