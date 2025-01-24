import { fileTypeFromBuffer } from "file-type"
import { resolveBufferLike } from "./bufferlike"
import { hash } from "./crypto"
import { TraceOptions } from "./trace"
import { join } from "node:path"
import { stat, writeFile } from "fs/promises"

export async function fileWriteCached(
    bufferLike: BufferLike,
    dir: string,
    options?: TraceOptions
): Promise<string> {
    const bytes = await resolveBufferLike(bufferLike, options)
    const { ext } = (await fileTypeFromBuffer(bytes)) || { ext: ".bin" }
    const filename = await hash(bytes, { length: 64 })
    const fn = join(dir, filename + "." + ext)
    try {
        await stat(fn)
        return fn
    } catch {}
    await writeFile(fn, bytes)
    return fn
}
