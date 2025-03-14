import { fileTypeFromBuffer } from "./filetype"
import { resolveBufferLike } from "./bufferlike"
import { hash } from "./crypto"
import { TraceOptions } from "./trace"
import { basename, dirname, join, relative } from "node:path"
import { stat, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { dotGenaiscriptPath, logVerbose } from "./util"
import prettyBytes from "pretty-bytes"

export async function fileWriteCached(
    dir: string,
    bufferLike: BufferLike,
    options?: TraceOptions & CancellationOptions
): Promise<string> {
    const { cancellationToken } = options || {}
    const bytes = await resolveBufferLike(bufferLike, options)
    checkCancelled(cancellationToken)
    const { ext } = (await fileTypeFromBuffer(bytes)) || { ext: "bin" }
    checkCancelled(cancellationToken)
    const filename = await hash(bytes, { length: 64 })
    checkCancelled(cancellationToken)
    const f = filename + "." + ext
    const fn = join(dir, f)
    try {
        const r = await stat(fn)
        if (r.isFile()) return fn
    } catch {}

    logVerbose(`image cache: ${fn} (${prettyBytes(bytes.length)})`)
    await ensureDir(dirname(fn))
    await writeFile(fn, bytes)

    return fn
}

export async function fileCacheImage(
    url: string,
    options?: TraceOptions & CancellationOptions & { dir?: string }
): Promise<string> {
    if (!url) return ""
    if (/^https?:\/\//.test(url)) return url
    const {
        dir = dotGenaiscriptPath("images"),
        trace,
        cancellationToken,
    } = options || {}
    const fn = await fileWriteCached(
        dir,
        url,
        { trace, cancellationToken } // TODO: add trace
    )
    return options?.dir ? `./${basename(fn)}` : fn
}
