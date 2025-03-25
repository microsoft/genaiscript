import { GENAISCRIPT_FOLDER, HTTPS_REGEX } from "./constants"
import { isCancelError, serializeError } from "./error"
import { host } from "./host"
import { YAMLStringify } from "./yaml"
import { arrayify as arrayify_ } from "./cleaners"

/**
 * Compares two strings for equality.
 * 
 * Returns:
 * - 0 if the strings are equal.
 * - A negative value if the first string is less than the second.
 * - A positive value if the first string is greater than the second.
 * 
 * @param a The first string to compare.
 * @param b The second string to compare.
 */
export function strcmp(a: string, b: string) {
    if (a == b) return 0
    if (a < b) return -1
    else return 1
}

export const arrayify = arrayify_

/**
 * Converts an array-like object to an array.
 * If the provided object is null or undefined, returns undefined.
 * Iterates over the elements of the array-like object and populates a new array.
 * 
 * @param a The array-like object to convert.
 * @returns A new array populated with the elements of the input object.
 */
export function toArray<T>(a: ArrayLike<T>): T[] {
    if (!a) return undefined
    const r: T[] = new Array(a.length)
    for (let i = 0; i < a.length; ++i) r[i] = a[i]
    return r
}

/**
 * Concatenates an array of string tokens into a single string, 
 * separated by commas. Filters out any undefined, null, or 
 * empty string tokens before joining.
 * 
 * @param token - Strings to be concatenated.
 * @returns A single string containing the concatenated tokens. 
 *          If all tokens are undefined, null, or empty, returns an empty string.
 */
export function toStringList(...token: string[]) {
    const md = token
        .filter((l) => l !== undefined && l !== null && l !== "")
        .join(", ")
    return md
}

/**
 * Parses a string to determine its boolean equivalent.
 *
 * Accepts variations of true and false inputs. Returns true for "y", "yes", "true", "ok" (case insensitive),
 * and false for "n", "no", "false", "ok" (case insensitive). 
 * Returns undefined for any other input.
 *
 * @param s - The string to be parsed.
 * @returns A boolean value or undefined.
 */
export function parseBoolean(s: string) {
    return /^\s*(y|yes|true|ok)\s*$/i.test(s)
        ? true
        : /^\s*(n|no|false|ok)\s*$/i.test(s)
          ? false
          : undefined
}

/**
 * Collapses consecutive empty lines in the provided text.
 * Replaces instances of two or more consecutive newlines with two newlines.
 * If the input text is undefined or null, the function returns undefined.
 *
 * @param text - The input text to process.
 * @returns The processed text with collapsed empty lines or undefined if input is not provided.
 */
export function collapseEmptyLines(text: string) {
    return text?.replace(/(\r?\n){2,}/g, "\n\n")
}

/**
 * Asserts that a given condition is true. If the condition is false, it logs an error message,
 * optionally logs additional debug data, triggers the debugger, and throws an Error with a specified message.
 *
 * @param cond - The condition to evaluate.
 * @param msg - The message to display if the assertion fails.
 * @param debugData - Optional additional data to log for debugging purposes.
 */
export function assert(
    cond: boolean,
    msg = "Assertion failed",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debugData?: any
) {
    if (!cond) {
        if (debugData) console.error(msg || `assertion failed`, debugData)
        // eslint-disable-next-line no-debugger
        debugger
        throw new Error(msg)
    }
}

/**
 * Concatenates multiple buffer chunks into a single Uint8Array.
 *
 * @param chunks - A variable number of ArrayLike objects containing buffer data.
 * @returns A single Uint8Array containing the concatenated buffer data.
 */
export function concatBuffers(...chunks: ArrayLike<number>[]) {
    let sz = 0
    for (const ch of chunks) sz += ch.length
    const r = new Uint8Array(sz)
    sz = 0
    for (const ch of chunks) {
        r.set(ch, sz)
        sz += ch.length
    }
    return r
}

/**
 * Converts an array of bytes to a hexadecimal string representation.
 * Optionally inserts a separator between each byte in the output string.
 *
 * @param bytes - An array-like object containing byte values.
 * @param sep - An optional string used as a separator between byte values.
 * @returns A string representing the hexadecimal values of the input bytes, 
 *          or undefined if the input is invalid.
 */
export function toHex(bytes: ArrayLike<number>, sep?: string) {
    if (!bytes) return undefined
    let r = ""
    for (let i = 0; i < bytes.length; ++i) {
        if (sep && i > 0) r += sep
        r += ("0" + bytes[i].toString(16)).slice(-2)
    }
    return r
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 * Each pair of hexadecimal digits is converted to its corresponding byte value.
 * If the input string length is odd, the last digit is ignored.
 *
 * @param hex - A string representing hexadecimal values.
 * @returns A Uint8Array containing the byte values.
 */
export function fromHex(hex: string) {
    const r = new Uint8Array(hex.length >> 1)
    for (let i = 0; i < hex.length; i += 2)
        r[i >> 1] = parseInt(hex.slice(i, i + 2), 16)
    return r
}

/**
 * Encodes a string into UTF-8 format.
 *
 * @param s - The string to be encoded in UTF-8.
 * @returns A Uint8Array containing the UTF-8 encoded bytes of the input string.
 */
export function utf8Encode(s: string) {
    return host.createUTF8Encoder().encode(s)
}

/**
 * Decodes a UTF-8 encoded Uint8Array into a string.
 * Utilizes the host's UTF-8 decoder to perform the decoding.
 *
 * @param buf - The Uint8Array containing UTF-8 encoded bytes.
 * @returns The decoded string.
 */
export function utf8Decode(buf: Uint8Array) {
    return host.createUTF8Decoder().decode(buf)
}

/**
 * Returns the relative path from the specified root to the given file name.
 * If the file name is empty or a URL, it returns the file name as is.
 * If the resolved absolute path of the file name starts with the root,
 * it returns the relative path by removing the root prefix. 
 * Leading slashes or backslashes are also removed from the resulting path.
 */
export function relativePath(root: string, fn: string) {
    // ignore empty path or urls
    if (!fn || HTTPS_REGEX.test(fn)) return fn
    const afn = host.path.resolve(fn)
    if (afn.startsWith(root)) {
        return afn.slice(root.length).replace(/^[\/\\]+/, "")
    }
    return fn
}

/**
 * Logs an informational message to the host's logging system.
 *
 * @param msg The message to log.
 */
export function logInfo(msg: string) {
    host.log("info", msg)
}

/**
 * Logs a verbose debug message.
 * Utilizes the host logging mechanism to record messages at the "debug" level.
 * This function is typically used for detailed informational purposes during development 
 * or troubleshooting. Messages logged will not be displayed in production environments, 
 * depending on the logging configuration.
 *
 * @param msg - The message to be logged.
 */
export function logVerbose(msg: string) {
    host.log("debug", msg)
}

/**
 * Logs a warning message.
 * This function utilizes the host logging mechanism to output a 
 * warning message, categorizing it under the "warn" level.
 *
 * @param msg - The message to be logged as a warning.
 */
export function logWarn(msg: string) {
    host.log("warn", msg)
}

/**
 * Logs an error message, including details of the error if available.
 * If the error is a cancellation error, logs a warning instead.
 * 
 * The function serializes the error message, extracting its message,
 * name, and stack trace. Additional serialized error data is logged
 * if present.
 * 
 * @param msg The error message or error object to be logged.
 */
export function logError(msg: string | Error | SerializedError) {
    const err = serializeError(msg)
    const { message, name, stack, ...e } = err || {}
    if (isCancelError(err)) {
        host.log("warn", message || "cancelled")
        return
    }
    host.log("error", message ?? name ?? "error")
    if (stack) host.log("debug", stack)
    if (Object.keys(e).length) {
        const se = YAMLStringify(e)
        host.log("debug", se)
    }
}

/**
 * Concatenates multiple arrays into a single array.
 *
 * This function takes any number of arrays and combines them into one array. 
 * If no arrays are provided, it returns an empty array.
 *
 * @param arrays - Arrays to be concatenated.
 * @returns A single concatenated array containing all elements from the provided arrays.
 */
export function concatArrays<T>(...arrays: T[][]): T[] {
    if (arrays.length == 0) return []
    return arrays[0].concat(...arrays.slice(1))
}

/**
 * Groups an array of items by a specified key.
 * 
 * @param list - The array of items to be grouped.
 * @param key - A function that extracts the key for grouping from each item.
 * @returns An object where each key corresponds to an array of items that share that key.
 */
export function groupBy<T>(
    list: T[],
    key: (value: T) => string
): Record<string, T[]> {
    if (!list) return {}

    const r: Record<string, T[]> = {}
    list.forEach((item) => {
        const k = key(item)
        const a = r[k] || (r[k] = [])
        a.push(item)
    })
    return r
}

/**
 * Truncates the given text to a specified length, appending an ellipsis if the text exceeds that length.
 * If the text length is less than or equal to the specified length, the original text is returned.
 * 
 * @param text - The string to be truncated.
 * @param length - The maximum length of the returned string.
 * @returns The truncated string with an ellipsis if applicable, otherwise the original text.
 */
export function ellipse(text: string, length: number) {
    if (text?.length > length) return text.slice(0, length - 1) + "…"
    else return text
}

/**
 * Truncates a given text from the start if its length exceeds the specified limit.
 * Returns the truncated text prefixed with an ellipsis.
 * If the text is shorter than or equal to the specified length, it is returned unchanged.
 * 
 * @param text The input string to be truncated.
 * @param length The maximum length of the output string including the ellipsis.
 * @returns A string that may be truncated and prefixed with an ellipsis.
 */
export function ellipseLast(text: string, length: number) {
    if (text?.length > length) return "…" + text.slice(length - text.length + 1)
    else return text
}
