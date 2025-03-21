import { GENAISCRIPT_FOLDER, HTTPS_REGEX } from "./constants"
import { isCancelError, serializeError } from "./error"
import { host } from "./host"
import { YAMLStringify } from "./yaml"
import { arrayify as arrayify_ } from "./cleaners"

export function strcmp(a: string, b: string) {
    if (a == b) return 0
    if (a < b) return -1
    else return 1
}

export const arrayify = arrayify_

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
    host.log("info", msg)
}

export function logVerbose(msg: string) {
    host.log("debug", msg)
}

export function logWarn(msg: string) {
    host.log("warn", msg)
}

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

export function ellipse(text: string, length: number) {
    if (text?.length > length) return text.slice(0, length - 1) + "…"
    else return text
}

export function ellipseLast(text: string, length: number) {
    if (text?.length > length) return "…" + text.slice(length - text.length + 1)
    else return text
}
