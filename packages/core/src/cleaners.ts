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

export function normalizeString(s: string | number | boolean | object): string {
    if (typeof s === "string") return s
    else if (typeof s === "number") return s.toLocaleString()
    else if (typeof s === "boolean") return s ? "true" : "false"
    else if (typeof s === "object") return JSON.stringify(s)
    else return undefined
}

export function normalizeFloat(s: string | number | boolean | object): number {
    if (typeof s === "string") {
        const f = parseFloat(s)
        return isNaN(f) ? undefined : f
    } else if (typeof s === "number") return s
    else if (typeof s === "boolean") return s ? 1 : 0
    else if (typeof s === "object") return 0
    else return undefined
}

export function normalizeInt(s: string | number | boolean | object): number {
    if (typeof s === "string") {
        const f = parseInt(s)
        return isNaN(f) ? undefined : f
    } else if (typeof s === "number") return s
    else if (typeof s === "boolean") return s ? 1 : 0
    else if (typeof s === "object") return 0
    else return undefined
}

export function trimTrailingSlash(s: string) {
    return s?.replace(/\/{1,10}$/, "")
}

export function normalizeVarKey(key: string) {
    return key.toLowerCase().replace(/[^a-z0-9\.]/g, "")
}

export function unmarkdown(text: string) {
    return text
        ?.replace(/\[([^\]]+)\]\([^)]+\)/g, (m, n) => n)
        ?.replace(/<\/?([^>]+)>/g, "")
}

/**
 * Collapses sequences of three or more consecutive newlines into two consecutive newlines.
 * @param res Input string to process.
 */
export function collapseNewlines(res: string): string {
    return res?.replace(/(\r?\n){3,}/g, "\n\n")
}

export function isEmptyString(s: string) {
    return s === null || s === undefined || s === ""
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}

/**
 * Replaces long, token-heavy identifiers like GUIDs with shorter encoded IDs.
 * @param text The original text containing the identifiers to be encoded.
 * @param options Optional configuration for customizing the encoding behavior, including matcher, prefix, open, and close delimiters.
 * @returns An object containing the encoded text, the original text, a decode function, the matcher regex, and a mapping of encoded IDs to original values.
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
