import { fileTypeFromBuffer } from "./filetype"
import { resolveBufferLike } from "./bufferlike"
import { hash } from "./crypto"
import { TraceOptions } from "./trace"
import { basename, dirname, join, relative } from "node:path"
import { stat, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { logVerbose } from "./util"
import prettyBytes from "pretty-bytes"
import { dotGenaiscriptPath } from "./workdir"

/**
 * Caches an image by writing it to a specified directory if it does not already exist.
 * Resolves a buffer-like input to a Buffer, checks for cancellation, determines the file extension
 * based on the image type, generates a unique filename using a hash of the content, and writes 
 * the data to a file. If the file already exists, the function returns the path to the existing file.
 *
 * @param dir - The directory where the file will be cached.
 * @param bufferLike - The input data to be cached, provided as a buffer-like structure.
 * @param options - Optional parameters that may include tracing and cancellation options.
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

/**
 * Caches an image from a specified URL or returns the URL if it is a valid HTTP URL.
 * If the image is not already cached, it writes the image data to a file in the specified directory.
 * The file is named based on a hash of the image data and its file extension.
 *
 * @param url - The URL of the image to be cached or the image data directly.
 * @param options - Optional configuration for caching, including the directory for cached images, trace options, and cancellation token.
 * @returns The relative path to the cached image file or the original URL if it's valid.
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
    return options?.dir ? `./${basename(fn)}` : relative(process.cwd(), fn)
}
