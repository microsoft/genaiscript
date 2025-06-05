/**
 * Converts the input into an array, ensuring the result is always an array.
 *
 * @param a - Input value to be converted into an array. Can be a single value or an array.
 * @param options - Optional configuration for the function behavior.
 * @param options.filterEmpty - If true, removes falsy values from the resulting array.
 * @returns An array derived from the input. If the input is undefined, returns an empty array. If the input is already an array, returns a shallow copy of it.
 */
export declare function arrayify<T>(
  a: T | T[],
  options?: {
    filterEmpty?: boolean;
  },
): T[];
/**
 * Removes properties with `undefined` values from an object.
 * If the object is frozen, creates a new object without `undefined` values.
 *
 * @param o - The input object to be processed.
 *            If the object is frozen, a shallow copy is created with all `undefined` values removed.
 *            If the object is not frozen, `undefined` values are removed in-place.
 * @returns The object with `undefined` values removed.
 */
export declare function deleteUndefinedValues<T extends Record<string, any>>(o: T): T;
/**
 * Removes empty values from an object. Empty values include `undefined`, `null`, empty strings, and empty arrays.
 *
 * @param o - The object to process. It must be an object.
 * @returns The object with empty values removed.
 */
export declare function deleteEmptyValues<T extends Record<string, any>>(o: T): T;
/**
 * Converts a value to its string representation.
 *
 * @param s - The value to normalize. Can be a string, number, boolean, or object.
 *     - If the value is a string, it is returned unchanged.
 *     - If the value is a number, it is converted to a localized string format.
 *     - If the value is a boolean, it is converted to "true" or "false".
 *     - If the value is an object, it is converted to a JSON string.
 *
 * @returns The normalized string representation of the input value, or undefined if the input value type is unsupported.
 */
export declare function normalizeString(s: string | number | boolean | object): string;
/**
 * Converts a value to a floating-point number if possible.
 *
 * @param s - The input value to convert (string, number, boolean, or object).
 *   - If a string, attempts to parse as a floating-point number. Returns undefined if parsing fails.
 *   - If a number, returns the value as is.
 *   - If a boolean, returns 1 for true and 0 for false.
 *   - If an object, returns 0.
 *
 * @returns The floating-point representation of the input or undefined if conversion is not possible.
 */
export declare function normalizeFloat(s: string | number | boolean | object): number;
/**
 * Converts the given value to an integer.
 *
 * @param s - The input value to convert. Can be a string, number, boolean, or object.
 *   - If a string, it attempts to parse it to an integer.
 *   - If a number, it returns the number as is.
 *   - If a boolean, it returns 1 for true and 0 for false.
 *   - If an object, it returns 0.
 *   - For other types or invalid parsing, it returns undefined.
 * @returns The converted integer or undefined if conversion is not possible.
 */
export declare function normalizeInt(s: string | number | boolean | object): number;
/**
 * Parses a string and determines its boolean equivalent.
 *
 * @param s The string to parse. Expected values for `true` include "y", "yes", "true", or "ok" (case-insensitive).
 *          Expected values for `false` include "n", "no", "false", or "ok" (case-insensitive).
 *
 * @returns `true` if the input matches a positive boolean string, `false` if it matches a negative boolean string,
 *          or `undefined` if the input does not match either.
 */
export declare function normalizeBoolean(s: string): boolean;
/**
 * Removes one or more trailing slashes from the end of a string.
 *
 * @param s The input string to process. It may include trailing slashes to be removed.
 * @returns The input string with trailing slashes removed, or the original string if no trailing slashes are present.
 */
export declare function trimTrailingSlash(s: string): string;
export declare function ensureHeadSlash(s: string): string;
/**
 * Converts a variable name to a normalized format by converting it to lowercase
 * and removing all characters except alphanumeric characters and periods.
 *
 * @param key The variable name to normalize. Non-alphanumeric characters except periods will be stripped.
 * @returns The normalized variable name as a string.
 */
export declare function normalizeVarKey(key: string): string;
/**
 * Removes Markdown and HTML formatting from a given text string.
 *
 * @param text The input string containing Markdown links ([text](url)) and/or
 * HTML tags. If the input is null or undefined, the function returns undefined.
 * @returns A plain text string with Markdown links transformed to their text content
 * and HTML tags removed.
 */
export declare function unmarkdown(text: string): string;
/**
 * Collapses sequences of three or more consecutive newlines into two consecutive newlines.
 * If the input is null or undefined, returns undefined.
 * @param res The input string to process.
 * @returns The processed string with collapsed newlines.
 */
export declare function collapseNewlines(res: string): string;
/**
 * Checks if a given string is empty.
 *
 * @param s - The string to evaluate. Can be null, undefined, or a string value.
 * @returns True if the string is null, undefined, or an empty string; otherwise, false.
 */
export declare function isEmptyString(s: string): boolean;
/**
 * Replaces long, token-heavy identifiers like GUIDs with shorter encoded IDs.
 * @param text The input string containing identifiers to encode.
 * @param options Optional configuration for encoding behavior, including a regex matcher, prefix, and delimiters for encoded IDs. Defaults to matching GUIDs, prefix "id", and delimiters "{|" and "|}".
 * @returns An object containing the encoded text, original text, a decode function to revert encoded IDs, the matcher regex, and a mapping of encoded IDs to original values. The decode function replaces encoded IDs with their original values.
 */
export declare function encodeIDs(
  text: string,
  options?: EncodeIDsOptions,
): {
  encoded: string;
  text: string;
  decode: (text: string) => string;
  matcher: RegExp;
  ids: Record<string, string>;
};
//# sourceMappingURL=cleaners.d.ts.map
