/**
 * Converts the input into an array, ensuring the result is always an array.
 *
 * @param a - Input value to be converted into an array. Can be a single value or an array.
 * @param options - Optional configuration for the function behavior.
 * @param options.filterEmpty - If true, removes falsy values from the resulting array.
 * @returns An array derived from the input. If the input is undefined, returns an empty array. If the input is already an array, returns a shallow copy of it.
 */
export function arrayify<T>(
    a: T | T[],
    options?: { filterEmpty?: boolean }
): T[] {
    const { filterEmpty } = options || {}

    let r: T[]
    if (a === undefined) r = []
    else if (Array.isArray(a)) r = a.slice(0)
    else r = [a]

    if (filterEmpty) return r.filter((f) => !!f)

    return r
}

/**
 * Removes properties with `undefined` values from an object.
 * If the object is frozen, creates a new object without `undefined` values.
 *
 * @param o - The input object to be processed.
 *            If the object is frozen, a shallow copy is created with all `undefined` values removed.
 *            If the object is not frozen, `undefined` values are removed in-place.
 * @returns The object with `undefined` values removed.
 */
export function deleteUndefinedValues<T extends Record<string, any>>(o: T): T {
    if (typeof o === "object" && Object.isFrozen(o)) {
        const res: any = {}
        for (const k in o) if (o[k] !== undefined) res[k] = o[k]
        return res as T
    }
    if (typeof o === "object")
        for (const k in o) if (o[k] === undefined) delete o[k]
    return o
}

/**
 * Removes empty values from an object. Empty values include `undefined`, `null`, empty strings, and empty arrays.
 *
 * @param o - The object to process. It must be an object.
 * @returns The object with empty values removed.
 */
export function deleteEmptyValues<T extends Record<string, any>>(o: T): T {
    if (typeof o === "object")
        for (const k in o) {
            const v = o[k]
            if (
                v === undefined ||
                v === null ||
                v === "" ||
                (Array.isArray(v) && !v.length)
            )
                delete o[k]
        }
    return o
}

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
export function normalizeString(s: string | number | boolean | object): string {
    if (typeof s === "string") return s
    else if (typeof s === "number") return s.toLocaleString()
    else if (typeof s === "boolean") return s ? "true" : "false"
    else if (typeof s === "object") return JSON.stringify(s)
    else return undefined
}

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
export function normalizeFloat(s: string | number | boolean | object): number {
    if (typeof s === "string") {
        const f = parseFloat(s)
        return isNaN(f) ? undefined : f
    } else if (typeof s === "number") return s
    else if (typeof s === "boolean") return s ? 1 : 0
    else if (typeof s === "object") return 0
    else return undefined
}

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
export function normalizeInt(s: string | number | boolean | object): number {
    if (typeof s === "string") {
        const f = parseInt(s)
        return isNaN(f) ? undefined : f
    } else if (typeof s === "number") return s
    else if (typeof s === "boolean") return s ? 1 : 0
    else if (typeof s === "object") return 0
    else return undefined
}

/**
 * Parses a string and determines its boolean equivalent.
 *
 * @param s The string to parse. Expected values for `true` include "y", "yes", "true", or "ok" (case-insensitive).
 *          Expected values for `false` include "n", "no", "false", or "ok" (case-insensitive).
 *
 * @returns `true` if the input matches a positive boolean string, `false` if it matches a negative boolean string,
 *          or `undefined` if the input does not match either.
 */
export function normalizeBoolean(s: string) {
    return /^\s*(y|yes|true|ok)\s*$/i.test(s)
        ? true
        : /^\s*(n|no|false|ok)\s*$/i.test(s)
          ? false
          : undefined
}

/**
 * Removes one or more trailing slashes from the end of a string.
 *
 * @param s The input string to process. It may include trailing slashes to be removed.
 * @returns The input string with trailing slashes removed, or the original string if no trailing slashes are present.
 */
export function trimTrailingSlash(s: string) {
    return s?.replace(/\/{1,10}$/, "")
}

export function ensureHeadSlash(s: string) {
    if (s?.startsWith("/")) return s
    return "/" + s
}

/**
 * Converts a variable name to a normalized format by converting it to lowercase
 * and removing all characters except alphanumeric characters and periods.
 *
 * @param key The variable name to normalize. Non-alphanumeric characters except periods will be stripped.
 * @returns The normalized variable name as a string.
 */
export function normalizeVarKey(key: string) {
    return key.toLowerCase().replace(/[^a-z0-9\.]/g, "")
}

/**
 * Removes Markdown and HTML formatting from a given text string.
 *
 * @param text The input string containing Markdown links ([text](url)) and/or
 * HTML tags. If the input is null or undefined, the function returns undefined.
 * @returns A plain text string with Markdown links transformed to their text content
 * and HTML tags removed.
 */
export function unmarkdown(text: string) {
    return text
        ?.replace(/\[([^\]]+)\]\([^)]+\)/g, (m, n) => n)
        ?.replace(/<\/?([^>]+)>/g, "")
}

/**
 * Collapses sequences of three or more consecutive newlines into two consecutive newlines.
 * If the input is null or undefined, returns undefined.
 * @param res The input string to process.
 * @returns The processed string with collapsed newlines.
 */
export function collapseNewlines(res: string): string {
    return res?.replace(/(\r?\n){3,}/g, "\n\n")
}

/**
 * Checks if a given string is empty.
 *
 * @param s - The string to evaluate. Can be null, undefined, or a string value.
 * @returns True if the string is null, undefined, or an empty string; otherwise, false.
 */
export function isEmptyString(s: string) {
    return s === null || s === undefined || s === ""
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

/**
 * Replaces long, token-heavy identifiers like GUIDs with shorter encoded IDs.
 * @param text The input string containing identifiers to encode.
 * @param options Optional configuration for encoding behavior, including a regex matcher, prefix, and delimiters for encoded IDs. Defaults to matching GUIDs, prefix "id", and delimiters "{|" and "|}".
 * @returns An object containing the encoded text, original text, a decode function to revert encoded IDs, the matcher regex, and a mapping of encoded IDs to original values. The decode function replaces encoded IDs with their original values.
 */
export function encodeIDs(
    text: string,
    options?: EncodeIDsOptions
): {
    encoded: string
    text: string
    decode: (text: string) => string
    matcher: RegExp
    ids: Record<string, string>
} {
    const {
        matcher = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
        prefix = "id",
        open = "{|",
        close = "|}",
    } = options || {}

    const ids: Record<string, string> = {}
    let idCounter = 0
    const encoded = text?.replace(matcher, (match, id) => {
        const encoded = `${open}${prefix}${idCounter++}${close}`
        ids[encoded] = match
        return encoded
    })

    const drx = new RegExp(
        `${escapeRegExp(open)}${prefix}(\\d+)${escapeRegExp(close)}`,
        "g"
    )
    const decode = (text: string) =>
        text?.replace(drx, (encoded) => ids[encoded])

    return { text, encoded, decode, matcher, ids }
}
