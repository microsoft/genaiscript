"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSON5Stringify = void 0;
exports.isJSONObjectOrArray = isJSONObjectOrArray;
exports.JSONTryParse = JSONTryParse;
exports.JSONrepair = JSONrepair;
exports.JSON5parse = JSON5parse;
exports.JSON5TryParse = JSON5TryParse;
exports.JSONLLMTryParse = JSONLLMTryParse;
/* eslint-disable curly */
/**
 * This module provides functions for parsing and repairing JSON5 strings,
 * as well as utilities for handling fenced code blocks.
 *
 * Tags: JSON5, Parsing, Repair, Fenced Blocks
 */
// Importing parse and stringify functions from the json5 library.
const json5_1 = __importDefault(require("json5"));
const { parse, stringify } = json5_1.default;
// Importing jsonrepair function for fixing broken JSON strings.
const jsonrepair_1 = require("jsonrepair");
// Importing unfence function to handle fenced code blocks.
const unwrappers_js_1 = require("./unwrappers.js");
const think_js_1 = require("./think.js");
/**
 * Checks if the input text starts with '{' or '[', indicating a JSON object or array.
 * Removes leading whitespace before evaluation.
 * @param text - The input string to check.
 * @returns True if the string starts with '{' or '[', false otherwise.
 */
function isJSONObjectOrArray(text) {
    // Tests if the input string starts with '{' or '[' after removing any leading whitespace.
    return /^\s*[\{\[]/.test(text);
}
/**
 * Parses the input text as JSON. Returns undefined if parsing fails.
 * @param text - The input string to parse as JSON.
 * @returns The parsed object or undefined if parsing fails.
 */
function JSONTryParse(text) {
    try {
        return JSON.parse(text);
    }
    catch (e) {
        return undefined;
    }
}
/**
 * Repairs a potentially broken JSON string using jsonrepair.
 * @param text - The JSON string to repair.
 * @returns The repaired JSON string.
 */
function JSONrepair(text) {
    // Uses jsonrepair to fix any issues in the JSON string.
    const repaired = (0, jsonrepair_1.jsonrepair)(text);
    return repaired;
}
/**
 * Parses a JSON5 string with optional error handling and repair.
 * Removes fencing if present.
 * @param text - The JSON5 string to parse.
 * @param options - An object containing:
 *   - defaultValue: The value to return if parsing fails.
 *   - errorAsDefaultValue: Whether to return the default value on error.
 *   - repair: Whether to attempt repairing the input before parsing.
 * @returns The parsed object, the default value, or undefined/null based on options.
 */
function JSON5parse(text, options) {
    try {
        // Remove fencing if present.
        text = (0, unwrappers_js_1.unfence)(text, "json");
        if (options?.repair) {
            try {
                // Attempt parsing without repairing first.
                const res = parse(text);
                return res;
            }
            catch {
                // Repair and parse if initial parsing fails.
                const repaired = JSONrepair(text);
                const res = parse(repaired);
                return res ?? options?.defaultValue;
            }
        }
        else {
            // Parse without repair if repair option is false.
            const res = parse(text);
            return res;
        }
    }
    catch (e) {
        // Return default value if error occurs and errorAsDefaultValue is true.
        if (options?.errorAsDefaultValue)
            return options?.defaultValue;
        throw e;
    }
}
/**
 * Tries to parse a JSON5 string and returns a default value if parsing fails.
 * @param text - The JSON5 string to parse.
 * @param defaultValue - The value to return if parsing fails.
 * @returns The parsed object or the default value.
 */
/**
 * Tries to parse a JSON5 string and returns a default value if parsing fails.
 *
 * @param text - The JSON5 string to parse. Can be undefined, null, or empty.
 * @param defaultValue - The value to return if parsing fails or if the input is empty.
 * @returns The parsed object, default value, or null/undefined based on input.
 */
function JSON5TryParse(text, defaultValue) {
    if (text === undefined)
        return undefined;
    if (text === null)
        return null;
    // Uses JSON5parse with repair option and errorAsDefaultValue set to true.
    return JSON5parse(text, {
        defaultValue,
        errorAsDefaultValue: true,
        repair: true,
    });
}
/**
 * Parses a JSON-like string, removes fencing and unnecessary formatting, and returns the parsed object.
 * If the input is undefined or null, returns it as-is. If the input is an empty string, returns an empty object.
 * Removes fencing and applies additional cleaning before parsing.
 * @param s - The JSON-like string to parse. Can be undefined, null, or empty. Fencing and unnecessary formatting are removed.
 * @returns The parsed object, the original input, or an empty object if input is empty.
 */
function JSONLLMTryParse(s) {
    if (s === undefined || s === null)
        return s;
    if (s === "")
        return {};
    // Removes any fencing and then tries to parse the string.
    const cleaned = (0, unwrappers_js_1.unfence)((0, think_js_1.unthink)(s), "json");
    return JSON5TryParse(cleaned);
}
// Export the JSON5 stringify function directly for convenience.
exports.JSON5Stringify = stringify;
//# sourceMappingURL=json5.js.map