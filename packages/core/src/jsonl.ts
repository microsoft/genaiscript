import { host } from "./host"
import { concatBuffers, logWarn, utf8Decode, utf8Encode } from "./util"

function tryReadFile(fn: string) {
    return host.readFile(fn).then<Uint8Array>(
        (r) => r,
        (_) => null
    )
}

export function isJSONLFilename(fn: string) {
    return /\.(jsonl|mdjson|ldjson)$/i.test(fn)
}

export async function readJSONL(fn: string) {
    const buf = await tryReadFile(fn)
    const res: any[] = []
    if (buf == null) return res
    let line = 1
    let numerr = 0
    const decoder = host.createUTF8Decoder()
    for (let pos = 0; pos < buf.length; ) {
        let ep = buf.indexOf(10, pos)
        if (ep < 0) ep = buf.length
        const str = decoder.decode(buf.slice(pos, ep))
        if (!/^\s*$/.test(str)) {
            try {
                res.push(JSON.parse(str))
            } catch {
                if (!numerr) logWarn(`${fn}(${line}): JSON error`)
                numerr++
            }
        }
        pos = ep + 1
        line++
    }
    return res
}

function serialize(objs: any[]) {
    let accLen = 0
    let acc = ""
    for (const o of objs) {
        const s = JSON.stringify(o)
        accLen += s.length + 1
        acc += s + "\n"
    }

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

export async function appendJSONL(fn: string, objs: any[]) {
    await writeJSONLCore(fn, objs, true)
}
