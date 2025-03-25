import { host } from "./host"
import { JSON5TryParse } from "./json5"
import { concatBuffers, logVerbose, logWarn } from "./util"

function tryReadFile(fn: string) {
    return host.readFile(fn).then<Uint8Array>(
        (r) => r,
        (_) => null
    )
}

/**
 * Checks if the given filename has a JSON Lines (JSONL) extension.
 * Supported extensions include .jsonl, .mdjson, and .ldjson.
 *
 * @param fn - The filename to check.
 * @returns True if the filename has a JSONL extension; otherwise, false.
 */
export function isJSONLFilename(fn: string) {
    return /\.(jsonl|mdjson|ldjson)$/i.test(fn)
}

/**
 * Parses a JSON Lines (JSONL) formatted string and returns an array of objects.
 * This function processes each line of the input string, attempting to parse it 
 * as JSON using the JSON5 parsing utility. Lines that are blank or result in 
 * undefined or null values during parsing are excluded from the output array.
 *
 * @param text - The JSONL formatted string to parse.
 * @param options - Optional parameters for parsing, including a repair option.
 * @returns An array of parsed objects from the input string.
 */
export function JSONLTryParse(
    text: string,
    options?: {
        repair?: boolean
    }
): any[] {
    if (!text) return []
    const res: any[] = []
    const lines = text.split("\n")
    for (const line of lines.filter((l) => !!l.trim())) {
        const obj = JSON5TryParse(line, options)
        if (obj !== undefined && obj !== null) res.push(obj)
    }
    return res
}

/**
 * Converts an array of objects to a JSON Lines (JSONL) formatted string.
 * Each object is serialized to a JSON string and concatenated with newline 
 * characters. If the input array is empty or contains no valid objects, an 
 * empty string is returned.
 *
 * @param objs - The array of objects to be converted to JSONL format.
 * 
 * @returns A string representing the array of objects in JSONL format.
 */
export function JSONLStringify(objs: any[]) {
    if (!objs?.length) return ""
    const acc: string[] = []
    for (const o of objs.filter((o) => o !== undefined && o !== null)) {
        const s = JSON.stringify(o)
        acc.push(s)
    }
    return acc.join("\n") + "\n"
}

function serialize(objs: any[]) {
    const acc = JSONLStringify(objs)
    const buf = host.createUTF8Encoder().encode(acc)
    return buf
}

async function writeJSONLCore(fn: string, objs: any[], append: boolean) {
    let buf = serialize(objs)
    if (append) {
        const curr = await tryReadFile(fn)
        if (curr) buf = concatBuffers(curr, buf)
    }
    await host.writeFile(fn, buf)
}

/**
 * Writes an array of objects to a specified JSONL file.
 * This function overwrites any existing content in the file.
 * 
 * @param fn - The name of the file to write to.
 * @param objs - The array of objects to be written to the file in JSONL format.
 */
export async function writeJSONL(fn: string, objs: any[]) {
    await writeJSONLCore(fn, objs, false)
}

/**
 * Appends objects to a JSON Lines (JSONL) file.
 * If meta information is provided, each object will include that meta data under the `__meta` key.
 * The file's content is preserved if it already exists.
 * 
 * @param name - The name of the JSONL file to append to.
 * @param objs - The array of objects to append.
 * @param meta - Optional meta information to attach to each object.
 */
export async function appendJSONL<T>(name: string, objs: T[], meta?: any) {
    if (meta)
        await writeJSONLCore(
            name,
            objs.map((obj) => ({ ...obj, __meta: meta })),
            true
        )
    else await writeJSONLCore(name, objs, true)
}
