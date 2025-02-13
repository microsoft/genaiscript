import { fileTypeFromBuffer } from "./filetype"
import { resolveBufferLike } from "./bufferlike"
import { hash } from "./crypto"
import { TraceOptions } from "./trace"
import { dirname, join } from "node:path"
import { stat, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"

export async function fileWriteCached(
    dir: string,
    bufferLike: BufferLike,
    options?: TraceOptions
): Promise<string> {
    const bytes = await resolveBufferLike(bufferLike, options)
    const { ext } = (await fileTypeFromBuffer(bytes)) || { ext: "bin" }
    const filename = await hash(bytes, { length: 64 })
    const fn = join(dir, filename + "." + ext)
    try {
        await stat(fn)
        return fn
    } catch {}
    await ensureDir(dirname(fn))
    await writeFile(fn, bytes)
    return fn
}
