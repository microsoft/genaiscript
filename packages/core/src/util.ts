import { GENAISCRIPT_FOLDER, HTTPS_REGEX } from "./constants"
import { isCancelError, serializeError } from "./error"
import { LogLevel, host } from "./host"
import { YAMLStringify } from "./yaml"

// chunk string into chunks of size n
export function chunkString(s: string, n: number) {
    if (!s?.length) return []
    if (s.length < n) return [s]

    const r: string[] = []
    for (let i = 0; i < s.length; i += n) r.push(s.slice(i, i + n))
    return r
}

export function trimNewlines(s: string) {
    return s?.replace(/^\n*/, "").replace(/\n*$/, "")
}

export function strcmp(a: string, b: string) {
    if (a == b) return 0
    if (a < b) return -1
    else return 1
}

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

export function toArray<T>(a: ArrayLike<T>): T[] {
    if (!a) return undefined
    const r: T[] = new Array(a.length)
    for (let i = 0; i < a.length; ++i) r[i] = a[i]
    return r
}

export function toStringList(...token: string[]) {
    const md = token
        .filter((l) => l !== undefined && l !== null && l !== "")
        .join(", ")
    return md
}

export function parseBoolean(s: string) {
    return /^\s*(y|yes|true|ok)\s*$/i.test(s)
        ? true
        : /^\s*(n|no|false|ok)\s*$/i.test(s)
          ? false
          : undefined
}

export function deleteUndefinedValues<T extends Record<string, any>>(o: T): T {
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

export function collapseEmptyLines(text: string) {
    return text?.replace(/(\r?\n){2,}/g, "\n\n")
}

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

export function toHex(bytes: ArrayLike<number>, sep?: string) {
    if (!bytes) return undefined
    let r = ""
    for (let i = 0; i < bytes.length; ++i) {
        if (sep && i > 0) r += sep
        r += ("0" + bytes[i].toString(16)).slice(-2)
    }
    return r
}

export function fromHex(hex: string) {
    const r = new Uint8Array(hex.length >> 1)
    for (let i = 0; i < hex.length; i += 2)
        r[i >> 1] = parseInt(hex.slice(i, i + 2), 16)
    return r
}

export function utf8Encode(s: string) {
    return host.createUTF8Encoder().encode(s)
}

export function utf8Decode(buf: Uint8Array) {
    return host.createUTF8Decoder().decode(buf)
}

// this will take lower 8 bits from each character
export function stringToUint8Array(input: string) {
    const len = input.length
    const res = new Uint8Array(len)
    for (let i = 0; i < len; ++i) res[i] = input.charCodeAt(i) & 0xff
    return res
}

export function uint8ArrayToString(input: ArrayLike<number>) {
    const len = input.length
    let res = ""
    for (let i = 0; i < len; ++i) res += String.fromCharCode(input[i])
    return res
}

declare var Buffer: any
export function fromBase64(encoded: string): Uint8Array {
    if (typeof Buffer == "function" && typeof Buffer.from == "function")
        return new Uint8Array(Buffer.from(encoded, "base64"))
    else return stringToUint8Array(atob(encoded))
}

export function toBase64(data: Uint8Array): string {
    if (typeof Buffer == "function" && typeof Buffer.from == "function")
        return Buffer.from(data).toString("base64")
    else return btoa(uint8ArrayToString(data))
}

export function dotGenaiscriptPath(...segments: string[]) {
    return host.resolvePath(
        host.projectFolder(),
        GENAISCRIPT_FOLDER,
        ...segments
    )
}

export function relativePath(root: string, fn: string) {
    // ignore empty path or urls
    if (!fn || HTTPS_REGEX.test(fn)) return fn
    const afn = host.path.resolve(fn)
    if (afn.startsWith(root)) {
        return afn.slice(root.length).replace(/^[\/\\]+/, "")
    }
    return fn
}

export function logInfo(msg: string) {
    host.log(LogLevel.Info, msg)
}

export function logVerbose(msg: string) {
    host.log(LogLevel.Verbose, msg)
}

export function logWarn(msg: string) {
    host.log(LogLevel.Warn, msg)
}

export function logError(msg: string | Error | SerializedError) {
    const err = serializeError(msg)
    const { message, name, stack, ...e } = err || {}
    if (isCancelError(err)) {
        host.log(LogLevel.Warn, message || "cancelled")
        return
    }
    host.log(LogLevel.Error, message ?? name ?? "error")
    if (stack) host.log(LogLevel.Verbose, stack)
    if (Object.keys(e).length) {
        const se = YAMLStringify(e)
        host.log(LogLevel.Verbose, se)
    }
}

export function concatArrays<T>(...arrays: T[][]): T[] {
    if (arrays.length == 0) return []
    return arrays[0].concat(...arrays.slice(1))
}

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

export function ellipse(text: string, length: number) {
    if (text?.length > length) return text.slice(0, length) + "..."
    else return text
}

export function roundWithPrecision(
    x: number,
    digits: number,
    round = Math.round
): number {
    digits = digits | 0
    // invalid digits input
    if (digits <= 0) return round(x)
    if (x == 0) return 0
    let r = 0
    while (r == 0 && digits < 21) {
        const d = Math.pow(10, digits++)
        r = round(x * d + Number.EPSILON) / d
    }
    return r
}

export function renderWithPrecision(
    x: number,
    digits: number,
    round = Math.round
): string {
    const r = roundWithPrecision(x, digits, round)
    let rs = r.toLocaleString()
    if (digits > 0) {
        let doti = rs.indexOf(".")
        if (doti < 0) {
            rs += "."
            doti = rs.length - 1
        }
        while (rs.length - 1 - doti < digits) rs += "0"
    }
    return rs
}

export function tagFilter(tags: string[], tag: string) {
    if (!tags?.length) return true
    const ltag = tag?.toLocaleLowerCase() || ""
    let exclusive = false
    for (const t of tags) {
        const lt = t.toLocaleLowerCase()
        const exclude = lt.startsWith(":!")
        if (exclude) exclusive = true

        if (exclude && ltag.startsWith(lt.slice(2))) return false
        else if (ltag.startsWith(t)) return true
    }
    return exclusive
}
