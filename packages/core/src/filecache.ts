import { resolveBufferLikeAndExt } from "./bufferlike"
import { hash } from "./crypto"
import { TraceOptions } from "./trace"
import { basename, dirname, join, relative } from "node:path"
import { stat, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { dotGenaiscriptPath } from "./workdir"
import { prettyBytes } from "./pretty"
import debug from "debug"
import { FILE_HASH_LENGTH, HTTPS_REGEX } from "./constants"
import { tryStat } from "./fs"
import { filenameOrFileToFilename } from "./unwrappers"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("cache")

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
    options?: TraceOptions &
        CancellationOptions & {
            /**
             * Generate file name extension
             */
            ext?: string
        }
): Promise<string> {
    const { bytes, ext: sourceExt } = await resolveBufferLikeAndExt(
        bufferLike,
        options
    )
    if (!bytes) {
        // file empty
        return undefined
    }
    const { cancellationToken, ext = sourceExt } = options || {}
    checkCancelled(cancellationToken)
    const filename = await hash(bytes, { length: FILE_HASH_LENGTH })
    checkCancelled(cancellationToken)
    const f = filename + "." + ext.replace(/^\./, "")
    dbg(`cache: %s`, f)
    const fn = join(dir, f)
    const r = await tryStat(fn)
    if (r?.isFile()) {
        dbg(`hit %s`, fn)
        return fn
    }

    dbg(`miss %s`, fn)
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
    url: BufferLike,
    options?: TraceOptions & CancellationOptions & { dir?: string }
): Promise<string> {
    if (!url) return ""

    const filename = filenameOrFileToFilename(url as any)
    if (typeof filename === "string" && HTTPS_REGEX.test(filename))
        return filename

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
    if (!fn) {
        dbg(`no file cached`)
        return undefined
    }
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
