// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { HTTPS_REGEX } from "./constants.js";
import { isCancelError, serializeError } from "./error.js";
import { host } from "./host.js";
import { YAMLStringify } from "./yaml.js";
import type { SerializedError } from "./types.js";

/**
 * Compares two strings lexicographically.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns 0 if the strings are equal, -1 if the first string is less than the second,
 *          and 1 if the first string is greater than the second.
 */
export function strcmp(a: string, b: string) {
  if (a == b) return 0;
  if (a < b) return -1;
  else return 1;
}

/**
 * Converts an array-like object into an array.
 *
 * @param a - The array-like object to convert. If null or undefined, it returns undefined.
 * @returns An array containing all elements from the input array-like object in the same order. If the input is null or undefined, it returns undefined.
 */
export function toArray<T>(a: ArrayLike<T>): T[] {
  if (!a) return undefined;
  const r: T[] = new Array(a.length);
  for (let i = 0; i < a.length; ++i) r[i] = a[i];
  return r;
}

/**
 * Converts a list of strings into a single comma-separated string.
 *
 * @param token - An array of strings to be processed. Empty, null, or undefined strings are ignored.
 * @returns A single string with valid input strings concatenated and separated by commas.
 */
export function toStringList(...token: string[]) {
  const md = token.filter((l) => l !== undefined && l !== null && l !== "").join(", ");
  return md;
}

/**
 * Collapses consecutive empty lines in a given text to a maximum of one.
 *
 * @param text - The input text to process. Can be undefined or null.
 * @returns The modified text where multiple consecutive empty lines are reduced to a single empty line. If the input is undefined or null, it returns the input as is.
 */
export function collapseEmptyLines(text: string) {
  return text?.replace(/(\r?\n){2,}/g, "\n\n");
}

/**
 * Concatenates multiple binary data chunks into a single buffer.
 *
 * @param chunks - A variable number of binary-like objects to be concatenated.
 *                 Each chunk must have a `length` property and support indexed access.
 * @returns A single buffer containing the combined data from all input chunks.
 */
export function concatBuffers(...chunks: ArrayLike<number>[]) {
  let sz = 0;
  for (const ch of chunks) sz += ch.length;
  const r = new Uint8Array(sz);
  sz = 0;
  for (const ch of chunks) {
    r.set(ch, sz);
    sz += ch.length;
  }
  return r;
}

/**
 * Converts an array-like sequence of bytes into a hexadecimal string representation.
 *
 * @param bytes - An array-like object containing byte values to be converted.
 * @param sep - An optional separator to insert between hexadecimal byte pairs.
 * @returns A string containing the hexadecimal representation of the input bytes,
 *          separated by the specified separator (if provided), or undefined if the input is invalid.
 */
export function toHex(bytes: ArrayLike<number>, sep?: string) {
  if (!bytes) return undefined;
  let r = "";
  for (let i = 0; i < bytes.length; ++i) {
    if (sep && i > 0) r += sep;
    r += ("0" + bytes[i].toString(16)).slice(-2);
  }
  return r;
}

/**
 * Converts a hexadecimal string into a Uint8Array.
 *
 * @param hex - The hexadecimal string to be converted. Each pair of characters corresponds to a byte.
 * @returns A Uint8Array representing the bytes derived from the hexadecimal string.
 */
export function fromHex(hex: string) {
  const r = new Uint8Array(hex.length >> 1);
  for (let i = 0; i < hex.length; i += 2) r[i >> 1] = parseInt(hex.slice(i, i + 2), 16);
  return r;
}

/**
 * Encodes a given string into a UTF-8 encoded byte sequence.
 *
 * @param s - The string to be encoded.
 * @returns A Uint8Array containing the UTF-8 encoded byte sequence of the input string.
 */
export function utf8Encode(s: string) {
  return host.createUTF8Encoder().encode(s);
}

/**
 * Decodes a UTF-8 encoded buffer into a string.
 *
 * @param buf - The buffer containing UTF-8 encoded data to decode.
 * @returns Decoded string representation of the buffer.
 */
export function utf8Decode(buf: Uint8Array) {
  return host.createUTF8Decoder().decode(buf);
}

/**
 * Resolves a file path relative to a specified root path.
 *
 * @param root The root directory to resolve the relative path against.
 * @param fn The file path to resolve. If it's empty, null, undefined, or matches a URL pattern, it is returned unmodified.
 * @returns The relative file path if it is within the root directory, otherwise the original file path.
 */
export function relativePath(root: string, fn: string) {
  // ignore empty path or urls
  if (!fn || HTTPS_REGEX.test(fn)) return fn;
  const afn = host.path.resolve(fn);
  if (afn.startsWith(root)) {
    return afn.slice(root.length).replace(/^[/\\]+/, "");
  }
  return fn;
}

/**
 * Logs an informational message.
 *
 * @param msg - The message to log. Must be a string containing the information to log.
 */
export function logInfo(msg: string) {
  host.log("info", msg);
}

/**
 * Logs a verbose debug message using the host logging system.
 *
 * @param msg - The message to be logged at debug level.
 */
export function logVerbose(msg: string) {
  host.log("debug", msg);
}

/**
 * Logs a warning message to the host system's logger.
 *
 * @param msg - The warning message to log. Should be a descriptive string providing details about the warning.
 */
export function logWarn(msg: string) {
  host.log("warn", msg);
}

/**
 * Logs an error message with additional debug information if available.
 *
 * @param msg - The error message, error object, or serialized error to log.
 *              If the message indicates a cancellation, it is logged as a warning.
 *
 * Details:
 * - Extracts error details such as message, name, and stack from the error object.
 * - Logs the error message at "error" severity.
 * - Logs the stack trace and additional serialized error data at "debug" severity if present.
 * - If the error is a cancellation, logs the message at "warn" severity instead.
 */
export function logError(msg: string | Error | SerializedError) {
  const err = serializeError(msg);
  const { message, name, stack, ...e } = err || {};
  if (isCancelError(err)) {
    host.log("warn", message || "cancelled");
    return;
  }
  host.log("error", message ?? name ?? "error");
  if (stack) host.log("debug", stack);
  if (Object.keys(e).length) {
    const se = YAMLStringify(e);
    host.log("debug", se);
  }
}

/**
 * Concatenates multiple arrays into a single array.
 *
 * @param arrays - A variable number of arrays to concatenate.
 * @returns A single array containing all elements from the input arrays in order.
 */
export function concatArrays<T>(...arrays: T[][]): T[] {
  if (arrays.length == 0) return [];
  return arrays[0].concat(...arrays.slice(1));
}

/**
 * Groups elements of a list into a record based on a key-generating function.
 *
 * @param list - The array of elements to group. If null or undefined, returns an empty record.
 * @param key - A function that generates a key for each element in the list. Elements with the same key are grouped together.
 * @returns A record where each key corresponds to a grouped array of elements.
 */
export function groupBy<T>(list: T[], key: (value: T) => string): Record<string, T[]> {
  if (!list) return {};

  const r: Record<string, T[]> = {};
  list.forEach((item) => {
    const k = key(item);
    const a = r[k] || (r[k] = []);
    a.push(item);
  });
  return r;
}

/**
 * Truncates the input text to a specified length and appends an ellipsis if the text exceeds the length.
 *
 * @param text - The input string to be truncated.
 * @param length - The maximum allowed length of the output string, including the ellipsis.
 * @returns The truncated string with an ellipsis appended if it exceeds the specified length.
 */
export function ellipse(text: string, length: number) {
  if (text?.length > length) return text.slice(0, length - 1) + "…";
  else return text;
}

/**
 * Truncates the beginning of a string if it exceeds the specified length and adds an ellipsis at the beginning.
 *
 * @param text - The input string to process. Can be undefined or null.
 * @param length - The maximum allowed length of the string including the ellipsis.
 * @returns The processed string with an ellipsis at the start if it exceeds the specified length, or the original string if it does not.
 */
export function ellipseLast(text: string, length: number) {
  if (text?.length > length) return "…" + text.slice(length - text.length + 1);
  else return text;
}
