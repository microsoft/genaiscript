"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCache = createCache;
const fscache_js_1 = require("./fscache.js");
const jsonlinecache_js_1 = require("./jsonlinecache.js");
const memcache_js_1 = require("./memcache.js");
const debug_1 = __importDefault(require("debug"));
const sanitize_js_1 = require("./sanitize.js");
const host_js_1 = require("./host.js");
const dbg = (0, debug_1.default)("genaiscript:cache");
function cacheNormalizeName(name) {
    return name ? (0, sanitize_js_1.sanitizeFilename)(name.replace(/[^a-z0-9_]/gi, "_")) : undefined; // Sanitize name
}
function createCache(name, options) {
    name = cacheNormalizeName(name); // Sanitize name
    if (!name) {
        dbg(`empty cache name`);
        return undefined;
    }
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
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
            r = new memcache_js_1.MemoryCache(name);
            break;
        case "jsonl":
            r = new jsonlinecache_js_1.JSONLineCache(name);
            break;
        default:
            r = new fscache_js_1.FsCache(name);
            break;
    }
    userState[key] = r;
    return r;
}
//# sourceMappingURL=cache.js.map