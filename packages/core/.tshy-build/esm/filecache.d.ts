import type { TraceOptions } from "./trace.js";
import { CancellationOptions } from "./cancellation.js";
import type { BufferLike } from "./types.js";
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
export declare function fileWriteCached(dir: string, bufferLike: BufferLike, options?: TraceOptions & CancellationOptions & {
    /**
     * Generate file name extension
     */
    ext?: string;
}): Promise<string>;
export declare function fileWriteCachedJSON(dir: string, data: any): Promise<string>;
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
export declare function fileCacheImage(url: BufferLike, options?: TraceOptions & CancellationOptions & {
    dir?: string;
}): Promise<string>;
export declare function patchCachedImages(text: string, patcher: (url: string) => string): string;
//# sourceMappingURL=filecache.d.ts.map