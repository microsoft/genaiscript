"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryResolveScript = tryResolveScript;
const constants_js_1 = require("./constants.js");
const host_js_1 = require("./host.js");
const workdir_js_1 = require("./workdir.js");
const node_path_1 = require("node:path");
const resources_js_1 = require("./resources.js");
const debug_js_1 = require("./debug.js");
const crypto_js_1 = require("./crypto.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("scripts:resolve");
/**
 * Attempts to resolve a script from the provided URL and manages caching.
 *
 * @param url - The URL of the resource to resolve.
 * @param options - Optional tracing and cancellation options.
 *   - TraceOptions: Includes trace-level details for debugging purposes.
 *   - CancellationOptions: Optionally permits cancellation during the process.
 * @returns The filename of the resolved script or undefined if resolution fails.
 *
 * If the resource is found, it checks for cached content. If cached, it computes a hash
 * and resolves the resource file within a managed `.genaiscript/resources` directory.
 * If no cached content is found, it returns the filename of the first file in the resource.
 */
async function tryResolveScript(url, options) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const resource = await (0, resources_js_1.tryResolveResource)(url, options);
    if (!resource)
        return undefined;
    const { uri, files } = resource;
    dbg(`resolved resource %s %d`, uri, files?.length);
    if (!files?.length)
        return undefined;
    const cache = files.some((f) => f.content);
    if (!cache)
        return files[0].filename;
    else {
        const sha = await (0, crypto_js_1.hash)([files], {
            length: constants_js_1.RESOURCE_HASH_LENGTH,
        });
        const fn = (0, workdir_js_1.dotGenaiscriptPath)("resources", uri.protocol, uri.hostname, sha);
        dbg(`resolved cache: %s`, fn);
        const cached = files.map((f) => ({
            ...f,
            filename: (0, node_path_1.join)(fn, f.filename),
        }));
        await runtimeHost.workspace.writeFiles(cached);
        return cached[0].filename;
    }
}
//# sourceMappingURL=scriptresolver.js.map