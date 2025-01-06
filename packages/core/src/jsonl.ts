import { host } from "./host"
import { JSON5TryParse } from "./json5"
import { concatBuffers, logVerbose, logWarn } from "./util"

function tryReadFile(fn: string) {
    return host.readFile(fn).then<Uint8Array>(
        (r) => r,
        (_) => null
    )
}

export function isJSONLFilename(fn: string) {
    return /\.(jsonl|mdjson|ldjson)$/i.test(fn)
}

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

export function JSONLStringify(objs: any[]) {
    const acc: string[] = []
    if (objs?.length)
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

export async function writeJSONL(fn: string, objs: any[]) {
    await writeJSONLCore(fn, objs, false)
}

export async function appendJSONL<T>(name: string, objs: T[], meta?: any) {
    if (meta)
        await writeJSONLCore(
            name,
            objs.map((obj) => ({ ...obj, __meta: meta })),
            true
        )
    else await writeJSONLCore(name, objs, true)
}
