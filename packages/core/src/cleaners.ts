/**
 * Converts a value or an array of values into an array.
 * If a single value is provided, it will be wrapped in an array.
 * If `filterEmpty` option is set to true, it will filter out any falsy values.
 *
 * @param a - The value or array of values to convert.
 * @param options - Optional parameters.
 * @param options.filterEmpty - If true, filters out empty values from the resulting array.
 * @returns An array containing the values.
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
 * Deletes properties with undefined values from an object.
 * If the object is frozen, a new object with the defined properties is returned.
 * Otherwise, the properties are removed from the original object.
 *
 * @param o - The object from which to delete undefined values.
 * @returns The modified object with undefined values removed.
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
 * Deletes properties with undefined, null, empty string, or empty array values from an object.
 *
 * This function iterates over each property of the object. If a property's value is 
 * undefined, null, an empty string, or an empty array, that property is removed from the object. 
 * The original object is modified in place and returned.
 *
 * @param o - The object from which to delete empty values.
 * @returns The modified object with empty values removed.
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
 * Normalizes the input value into a string representation.
 * 
 * @param s - The value to be normalized. It can be a string, number, boolean, or object.
 * @returns The normalized string. If the input is a string, it returns it directly. If it is a number, it converts it to a locale string. For boolean values, it returns "true" or "false". If the input is an object, it returns its JSON string representation. If the input is of any other type, it returns undefined.
 */
export function normalizeString(s: string | number | boolean | object): string {
    if (typeof s === "string") return s
    else if (typeof s === "number") return s.toLocaleString()
    else if (typeof s === "boolean") return s ? "true" : "false"
    else if (typeof s === "object") return JSON.stringify(s)
    else return undefined
}

/**
 * Converts a given input into a float.
 * If the input is a string, parses it as a float. 
 * If it is a number, returns it directly. 
 * If it is a boolean, returns 1 for true and 0 for false. 
 * If it is an object, returns 0. 
 * For any other input, returns undefined.
 *
 * @param s - Input to be normalized.
 * @returns A float representation of the input or undefined if the input cannot be converted.
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
 * Converts various input types to an integer.
 * 
 * The function first checks if the input is a string and attempts to parse it as an integer.
 * If the parsed value is NaN, it returns undefined. If the input is a number, it returns the 
 * number itself. For boolean values, it returns 1 for true and 0 for false. If the input 
 * is an object, it returns 0. For any other type, it returns undefined.
 * 
 * @param s - The input value to be normalized.
 * @returns An integer representation of the input or undefined if conversion is not possible.
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
 * Trims trailing slashes from a given string.
 * If the string ends with one or more slashes, they are removed.
 * The maximum number of slashes that can be trimmed is ten.
 *
 * @param s The input string from which trailing slashes are to be removed.
 * @returns The modified string without trailing slashes.
 */
export function trimTrailingSlash(s: string) {
    return s?.replace(/\/{1,10}$/, "")
}

/**
 * Normalizes a variable key by converting it to lowercase and removing 
 * any characters that are not lowercase letters, digits, or periods. 
 * This function ensures that the resulting key is standardized 
 * for consistent usage.
 * 
 * @param key - The variable key to be normalized.
 * @returns The normalized variable key as a string.
 */
export function normalizeVarKey(key: string) {
    return key.toLowerCase().replace(/[^a-z0-9\.]/g, "")
}

/**
 * Removes Markdown formatting from the input text.
 * Specifically, it converts inline links to their display text
 * and removes HTML tags. Returns the cleaned text.
 *
 * @param text The input string containing Markdown or HTML.
 * @returns The converted string without Markdown or HTML formatting.
 */
export function unmarkdown(text: string) {
    return text
        ?.replace(/\[([^\]]+)\]\([^)]+\)/g, (m, n) => n)
        ?.replace(/<\/?([^>]+)>/g, "")
}

/**
 * Collapse 3+ lines to 1
 */
export function collapseNewlines(res: string): string {
    return res?.replace(/(\r?\n){3,}/g, "\n\n")
}

/**
 * Checks if a given string is empty.
 * An empty string is defined as either null, undefined, or an empty string literal.
 *
 * @param s - The string to check.
 * @returns True if the string is empty; otherwise, false.
 */
export function isEmptyString(s: string) {
    return s === null || s === undefined || s === ""
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

/**
 * Replaces long, token hungry ids like GUIDS into short ids.
 * @param text original text
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
