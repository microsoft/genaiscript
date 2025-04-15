import { fileTypeFromBuffer } from "./filetype"
import { resolveBufferLike } from "./bufferlike"
import { hash } from "./crypto"
import { TraceOptions } from "./trace"
import { basename, dirname, join, relative } from "node:path"
import { stat, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { dotGenaiscriptPath } from "./workdir"
import { prettyBytes } from "./pretty"
import debug from "debug"
import { FILE_HASH_LENGTH } from "./constants"
import { tryStat } from "./fs"
const dbg = debug("genaiscript:filecache")

/**
 * Caches a file by writing it to a specified directory. If the file exists, it simply returns the path.
 *
 * @param dir - The directory where the file will be cached.
 * @param bufferLike - The data to be written, can be a buffer-like object.
 * @param options - Optional configurations, including tracing options and cancellation options.
 *   - cancellationToken - Token to support operation cancellation.
 *
 * @returns The path to the cached file.
 */
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
    const filename = await hash(bytes, { length: FILE_HASH_LENGTH })
    checkCancelled(cancellationToken)
    const f = filename + "." + ext
    const fn = join(dir, f)
    try {
        const r = await stat(fn)
        if (r.isFile()) return fn
    } catch {}

    dbg(`image cache: ${fn} (${prettyBytes(bytes.length)})`)
    await ensureDir(dirname(fn))
    await writeFile(fn, bytes)

    return fn
}

export async function fileWriteCachedJSON(dir: string, data: any) {
    const bytes = Buffer.from(JSON.stringify(data, null, 2))
    const filename = await hash(bytes, { length: FILE_HASH_LENGTH })
    const fn = join(dir, filename + ".json")
    const stat = await tryStat(fn)
    if (stat && stat.isFile()) return fn

    dbg(`json cache: ${fn} (${prettyBytes(bytes.length)})`)
    await ensureDir(dirname(fn))
    await writeFile(fn, bytes)

    return fn
}

/**
 * Caches an image locally if it is not a URL. Returns the path to the cached file or the original URL.
 *
 * @param url - The source of the image. If it is a URL, it is returned as is. If it is a local file path, it will be cached.
 * @param options - Optional settings for tracing, cancellation, and output directory.
 *    - dir: Custom directory to store the cached file. Defaults to a pre-defined image cache directory.
 *    - trace: Trace option for debugging or logging purposes.
 *    - cancellationToken: Token to handle operation cancellation.
 *
 * @returns The relative path to the cached file or the original URL if it is a remote target.
 */
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
    const res = options?.dir ? `./${basename(fn)}` : relative(process.cwd(), fn)
    dbg(`image: ${res}`)
    return res
}

export function patchCachedImages(
    text: string,
    patcher: (url: string) => string
) {
    const IMG_RX =
        /\!\[(?<alt>[^\]]*)\]\((?<url>\.genaiscript\/images\/[^)]+)\)/g
    return text.replace(IMG_RX, (_, alt, url) => `![${alt}](${patcher(url)})`)
}
