"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOMLParse = TOMLParse;
exports.TOMLTryParse = TOMLTryParse;
const toml_1 = require("toml");
const unwrappers_js_1 = require("./unwrappers.js");
const unwrappers_js_2 = require("./unwrappers.js");
/**
 * Parses a TOML-formatted input into a structured JavaScript object.
 *
 * @param text - The input to parse. It can be a string containing TOML-formatted content
 * or a WorkspaceFile object. If a WorkspaceFile is provided, its content is extracted
 * using `filenameOrFileToContent`.
 *
 * @returns A deep copy of the parsed object, created using `structuredClone`.
 *
 * @throws Will throw an error if the input cannot be successfully parsed as TOML.
 */
function TOMLParse(text) {
    text = (0, unwrappers_js_2.filenameOrFileToContent)(text);
    // Remove TOML fences from the text
    // `unfence` is assumed to sanitize or format the text for parsing
    const cleaned = (0, unwrappers_js_1.unfence)(text, "toml");
    // Parse the cleaned TOML string using the `parse` function
    // If parsing succeeds, return the parsed object
    const res = (0, toml_1.parse)(cleaned);
    return structuredClone(res);
}
// Function to safely parse TOML formatted text
// Accepts a string `text` and an optional `options` object with a `defaultValue`
// If parsing fails, it returns `defaultValue` instead of throwing an error
function TOMLTryParse(text, options) {
    try {
        return TOMLParse(text);
    }
    catch (e) {
        // If parsing throws an error, return the `defaultValue` provided in options
        // This provides a fallback mechanism for error scenarios
        return options?.defaultValue;
    }
}
//# sourceMappingURL=toml.js.map