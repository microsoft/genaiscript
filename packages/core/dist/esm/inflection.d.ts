/**
 * Splits camelCase or PascalCase text into separate words by inserting a space
 * between lowercase and uppercase character boundaries.
 *
 * @param text - The input string to be split. If null or undefined, the function returns as is.
 * @returns The modified string with spaces added between camelCase or PascalCase boundaries, or the original value if empty.
 */
export declare function splitalize(text: string): string;
/**
 * Transforms a given text into a titleized format. The function first separates
 * camelCase or PascalCase text into distinct words and then converts it into
 * a title format where the first letter of each word is capitalized.
 *
 * @param text - The input string to be titleized. If the input is null or empty,
 *               it returns the input as is.
 * @returns The titleized version of the input string.
 */
export declare function titleize(text: string): string;
/**
 * Converts a given text into a more human-readable format by separating camelCase or PascalCase
 * words and applying a humanization transformation.
 *
 * @param text - The input text to be humanized. If the input is falsy, it will be returned as is.
 * @returns The humanized version of the input text.
 */
export declare function humanize(text: string): string;
//# sourceMappingURL=inflection.d.ts.map
