"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelize = exports.capitalize = void 0;
exports.splitalize = splitalize;
exports.titleize = titleize;
exports.humanize = humanize;
const inflection_1 = require("inflection");
Object.defineProperty(exports, "capitalize", { enumerable: true, get: function () { return inflection_1.capitalize; } });
Object.defineProperty(exports, "camelize", { enumerable: true, get: function () { return inflection_1.camelize; } });
/**
 * Splits camelCase or PascalCase text into separate words by inserting a space
 * between lowercase and uppercase character boundaries.
 *
 * @param text - The input string to be split. If null or undefined, the function returns as is.
 * @returns The modified string with spaces added between camelCase or PascalCase boundaries, or the original value if empty.
 */
function splitalize(text) {
    if (!text)
        return text;
    return text?.replace(/([a-z])([A-Z])/g, "$1 $2");
}
/**
 * Transforms a given text into a titleized format. The function first separates
 * camelCase or PascalCase text into distinct words and then converts it into
 * a title format where the first letter of each word is capitalized.
 *
 * @param text - The input string to be titleized. If the input is null or empty,
 *               it returns the input as is.
 * @returns The titleized version of the input string.
 */
function titleize(text) {
    if (!text)
        return text;
    return (0, inflection_1.titleize)(splitalize(text));
}
/**
 * Converts a given text into a more human-readable format by separating camelCase or PascalCase
 * words and applying a humanization transformation.
 *
 * @param text - The input text to be humanized. If the input is falsy, it will be returned as is.
 * @returns The humanized version of the input text.
 */
function humanize(text) {
    if (!text)
        return text;
    return (0, inflection_1.humanize)(splitalize(text));
}
//# sourceMappingURL=inflection.js.map