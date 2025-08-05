// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { FsCache } from "./fscache.js";
import { JSONLineCache } from "./jsonlinecache.js";
import { MemoryCache } from "./memcache.js";
import debug from "debug";
import { sanitizeFilename } from "./sanitize.js";
import { resolveRuntimeHost } from "./host.js";
const dbg = debug("genaiscript:cache");
function cacheNormalizeName(name) {
    return name ? sanitizeFilename(name.replace(/[^a-z0-9_]/gi, "_")) : undefined; // Sanitize name
}
export function createCache(name, options) {
    name = cacheNormalizeName(name); // Sanitize name
    if (!name) {
        dbg(`empty cache name`);
        return undefined;
    }
    const runtimeHost = resolveRuntimeHost();
    const type = options?.type || "fs";
    const key = `cache:${type}:${name}`;
    const userState = options?.userState || runtimeHost.userState;
    if (userState[key])
        return userState[key]; // Return if exists
    if (options?.lookupOnly)
        return undefined;
    dbg(`creating ${name} ${type}`);
    let r;
    switch (type) {
        case "memory":
            r = new MemoryCache(name);
            break;
        case "jsonl":
            r = new JSONLineCache(name);
            break;
        default:
            r = new FsCache(name);
            break;
    }
    userState[key] = r;
    return r;
}
//# sourceMappingURL=cache.js.map