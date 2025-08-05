"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileWriteCached = fileWriteCached;
exports.fileWriteCachedJSON = fileWriteCachedJSON;
exports.fileCacheImage = fileCacheImage;
exports.patchCachedImages = patchCachedImages;
const bufferlike_js_1 = require("./bufferlike.js");
const crypto_js_1 = require("./crypto.js");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const fs_js_1 = require("./fs.js");
const cancellation_js_1 = require("./cancellation.js");
const workdir_js_1 = require("./workdir.js");
const pretty_js_1 = require("./pretty.js");
const constants_js_1 = require("./constants.js");
const fs_js_2 = require("./fs.js");
const unwrappers_js_1 = require("./unwrappers.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("cache");
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
async function fileWriteCached(dir, bufferLike, options) {
    const { bytes, ext: sourceExt } = await (0, bufferlike_js_1.resolveBufferLikeAndExt)(bufferLike, options);
    if (!bytes) {
        // file empty
        return undefined;
    }
    const { cancellationToken, ext = sourceExt } = options || {};
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    const filename = await (0, crypto_js_1.hash)(bytes, { length: constants_js_1.FILE_HASH_LENGTH });
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    const f = filename + "." + ext.replace(/^\./, "");
    dbg(`cache: %s`, f);
    const fn = (0, node_path_1.join)(dir, f);
    const r = await (0, fs_js_2.tryStat)(fn);
    if (r?.isFile()) {
        dbg(`hit %s`, fn);
        return fn;
    }
    dbg(`miss %s`, fn);
    await (0, fs_js_1.ensureDir)((0, node_path_1.dirname)(fn));
    await (0, promises_1.writeFile)(fn, bytes);
    return fn;
}
async function fileWriteCachedJSON(dir, data) {
    const bytes = Buffer.from(JSON.stringify(data, null, 2));
    const filename = await (0, crypto_js_1.hash)(bytes, { length: constants_js_1.FILE_HASH_LENGTH });
    const fn = (0, node_path_1.join)(dir, filename + ".json");
    const stat = await (0, fs_js_2.tryStat)(fn);
    if (stat && stat.isFile())
        return fn;
    dbg(`json cache: ${fn} (${(0, pretty_js_1.prettyBytes)(bytes.length)})`);
    await (0, fs_js_1.ensureDir)((0, node_path_1.dirname)(fn));
    await (0, promises_1.writeFile)(fn, bytes);
    return fn;
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
async function fileCacheImage(url, options) {
    if (!url)
        return "";
    const filename = (0, unwrappers_js_1.filenameOrFileToFilename)(url);
    if (typeof filename === "string" && constants_js_1.HTTPS_REGEX.test(filename))
        return filename;
    const { dir = (0, workdir_js_1.dotGenaiscriptPath)("images"), trace, cancellationToken } = options || {};
    const fn = await fileWriteCached(dir, url, { trace, cancellationToken });
    if (!fn) {
        dbg(`no file cached`);
        return undefined;
    }
    const res = options?.dir ? `./${(0, node_path_1.basename)(fn)}` : (0, node_path_1.relative)(process.cwd(), fn);
    dbg(`image: ${res}`);
    return res;
}
function patchCachedImages(text, patcher) {
    const IMG_RX = /\!\[(?<alt>[^\]]*)\]\((?<url>\.genaiscript\/images\/[^)]+)\)/g;
    return text.replace(IMG_RX, (_, alt, url) => `![${alt}](${patcher(url)})`);
}
//# sourceMappingURL=filecache.js.map