export * from "./log.js";
/**
 * Compares two strings lexicographically.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns 0 if the strings are equal, -1 if the first string is less than the second,
 *          and 1 if the first string is greater than the second.
 */
export declare function strcmp(a: string, b: string): 1 | 0 | -1;
/**
 * Converts an array-like object into an array.
 *
 * @param a - The array-like object to convert. If null or undefined, it returns undefined.
 * @returns An array containing all elements from the input array-like object in the same order. If the input is null or undefined, it returns undefined.
 */
export declare function toArray<T>(a: ArrayLike<T>): T[];
/**
 * Converts a list of strings into a single comma-separated string.
 *
 * @param token - An array of strings to be processed. Empty, null, or undefined strings are ignored.
 * @returns A single string with valid input strings concatenated and separated by commas.
 */
export declare function toStringList(...token: string[]): string;
/**
 * Collapses consecutive empty lines in a given text to a maximum of one.
 *
 * @param text - The input text to process. Can be undefined or null.
 * @returns The modified text where multiple consecutive empty lines are reduced to a single empty line. If the input is undefined or null, it returns the input as is.
 */
export declare function collapseEmptyLines(text: string): string;
/**
 * Concatenates multiple binary data chunks into a single buffer.
 *
 * @param chunks - A variable number of binary-like objects to be concatenated.
 *                 Each chunk must have a `length` property and support indexed access.
 * @returns A single buffer containing the combined data from all input chunks.
 */
export declare function concatBuffers(...chunks: ArrayLike<number>[]): Uint8Array<ArrayBuffer>;
/**
 * Converts an array-like sequence of bytes into a hexadecimal string representation.
 *
 * @param bytes - An array-like object containing byte values to be converted.
 * @param sep - An optional separator to insert between hexadecimal byte pairs.
 * @returns A string containing the hexadecimal representation of the input bytes,
 *          separated by the specified separator (if provided), or undefined if the input is invalid.
 */
export declare function toHex(bytes: ArrayLike<number>, sep?: string): string;
/**
 * Converts a hexadecimal string into a Uint8Array.
 *
 * @param hex - The hexadecimal string to be converted. Each pair of characters corresponds to a byte.
 * @returns A Uint8Array representing the bytes derived from the hexadecimal string.
 */
export declare function fromHex(hex: string): Uint8Array<ArrayBuffer>;
/**
 * Resolves a file path relative to a specified root path.
 *
 * @param root The root directory to resolve the relative path against.
 * @param fn The file path to resolve. If it's empty, null, undefined, or matches a URL pattern, it is returned unmodified.
 * @returns The relative file path if it is within the root directory, otherwise the original file path.
 */
export declare function relativePath(root: string, fn: string): string;
/**
 * Concatenates multiple arrays into a single array.
 *
 * @param arrays - A variable number of arrays to concatenate.
 * @returns A single array containing all elements from the input arrays in order.
 */
export declare function concatArrays<T>(...arrays: T[][]): T[];
/**
 * Groups elements of a list into a record based on a key-generating function.
 *
 * @param list - The array of elements to group. If null or undefined, returns an empty record.
 * @param key - A function that generates a key for each element in the list. Elements with the same key are grouped together.
 * @returns A record where each key corresponds to a grouped array of elements.
 */
export declare function groupBy<T>(list: T[], key: (value: T) => string): Record<string, T[]>;
/**
 * Truncates the input text to a specified length and appends an ellipsis if the text exceeds the length.
 *
 * @param text - The input string to be truncated.
 * @param length - The maximum allowed length of the output string, including the ellipsis.
 * @returns The truncated string with an ellipsis appended if it exceeds the specified length.
 */
export declare function ellipse(text: string, length: number): string;
/**
 * Truncates the beginning of a string if it exceeds the specified length and adds an ellipsis at the beginning.
 *
 * @param text - The input string to process. Can be undefined or null.
 * @param length - The maximum allowed length of the string including the ellipsis.
 * @returns The processed string with an ellipsis at the start if it exceeds the specified length, or the original string if it does not.
 */
export declare function ellipseLast(text: string, length: number): string;
//# sourceMappingURL=util.d.ts.map