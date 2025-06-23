// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { titleize as _titlelize, humanize as _humanize, capitalize, camelize } from "inflection";

export { capitalize, camelize };

/**
 * Splits camelCase or PascalCase text into separate words by inserting a space
 * between lowercase and uppercase character boundaries.
 *
 * @param text - The input string to be split. If null or undefined, the function returns as is.
 * @returns The modified string with spaces added between camelCase or PascalCase boundaries, or the original value if empty.
 */
export function splitalize(text: string) {
  if (!text) return text;
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
export function titleize(text: string) {
  if (!text) return text;
  return _titlelize(splitalize(text));
}

/**
 * Converts a given text into a more human-readable format by separating camelCase or PascalCase
 * words and applying a humanization transformation.
 *
 * @param text - The input text to be humanized. If the input is falsy, it will be returned as is.
 * @returns The humanized version of the input text.
 */
export function humanize(text: string) {
  if (!text) return text;
  return _humanize(splitalize(text));
}
