"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.YAMLTryParse = YAMLTryParse;
exports.YAMLParse = YAMLParse;
exports.YAMLStringify = YAMLStringify;
exports.createYAML = createYAML;
/**
 * This module provides utility functions to parse and stringify YAML content.
 * It includes functions to safely parse YAML strings with error handling,
 * as well as direct parse and stringify functionalities.
 */
const yaml_1 = require("yaml");
const unwrappers_js_1 = require("./unwrappers.js");
const indent_js_1 = require("./indent.js");
/**
 * Safely attempts to parse a YAML string into a JavaScript object.
 * Tries to parse the input YAML string, and returns a default value
 * in case of failure or specific conditions.
 *
 * @template T - The expected type of the parsed result.
 * @param text - The YAML string to parse.
 * @param defaultValue - A default value to return if parsing fails or if
 *                       `ignoreLiterals` is true and the result is a literal.
 * @param options - Optional settings for parsing.
 * @param options.ignoreLiterals - If true, returns the defaultValue when the
 *                                 parsed result is a primitive type (number,
 *                                 boolean, string).
 * @returns The parsed object, or the defaultValue if parsing fails or
 *          conditions are met.
 */
function YAMLTryParse(text, defaultValue, options) {
    const { ignoreLiterals } = options || {};
    try {
        const res = (0, yaml_1.parse)((0, unwrappers_js_1.filenameOrFileToContent)(text));
        // Check if parsed result is a primitive and ignoreLiterals is true
        if (ignoreLiterals && ["number", "boolean", "string"].includes(typeof res))
            return defaultValue;
        return res ?? defaultValue;
    }
    catch {
        // Return defaultValue in case of a parsing error
        return defaultValue;
    }
}
/**
 * Parses a YAML string or workspace file into a JavaScript object.
 * Converts the input to content if it is a workspace file.
 * Assumes the input is valid YAML.
 *
 * @param text - The YAML string or workspace file to parse.
 * @returns The parsed JavaScript object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function YAMLParse(text) {
    text = (0, unwrappers_js_1.filenameOrFileToContent)(text);
    return (0, yaml_1.parse)(text);
}
/**
 * Converts a JavaScript object into a YAML string.
 * This function provides a YAML representation of the input object.
 *
 * @param obj - The object to convert to YAML.
 * @returns The YAML string representation of the object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function YAMLStringify(obj) {
    return (0, yaml_1.stringify)(obj, undefined, 2);
}
/**
 * Creates a YAML handler with template string support for parsing and stringifying YAML content.
 * Combines the functionality to parse YAML strings, stringify objects to YAML,
 * and process template string inputs into parsed YAML objects.
 *
 * The handler function allows interpolation of values within template strings,
 * parses the resulting YAML string, and returns the parsed object.
 *
 * @param strings - An array of template string literals.
 * @param values - Corresponding interpolated values to be included in the YAML string.
 * @returns A parsed object generated from the combined template strings and values.
 */
function createYAML() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = (strings, ...values) => {
        let result = strings[0];
        values.forEach((value, i) => {
            result += String(value) + strings[i + 1];
        });
        const res = YAMLParse((0, indent_js_1.dedent)(result));
        return res;
    };
    res.parse = YAMLParse;
    res.stringify = YAMLStringify;
    return Object.freeze(res);
}
//# sourceMappingURL=yaml.js.map