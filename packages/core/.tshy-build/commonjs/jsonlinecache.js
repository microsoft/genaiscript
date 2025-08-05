"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONLineCache = void 0;
const jsonl_js_1 = require("./jsonl.js");
const host_js_1 = require("./host.js");
const fs_js_1 = require("./fs.js");
const workdir_js_1 = require("./workdir.js");
const memcache_js_1 = require("./memcache.js");
/**
 * A cache class that manages entries stored in JSONL format.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
class JSONLineCache extends memcache_js_1.MemoryCache {
    name;
    // Constructor is private to enforce the use of byName factory method
    constructor(name) {
        super(name); // Initialize EventTarget
        this.name = name;
    }
    // Get the folder path for the cache storage
    folder() {
        return (0, workdir_js_1.dotGenaiscriptPath)("cache", this.name);
    }
    // Get the full path to the cache file
    path() {
        const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
        return runtimeHost.resolvePath(this.folder(), "db.jsonl");
    }
    _initializePromise;
    /**
     * Initialize the cache by loading entries from the file.
     * Identifies duplicate entries and rewrites the file if necessary.
     */
    async initialize() {
        if (this._entries)
            return;
        if (this._initializePromise)
            return await this._initializePromise;
        this._initializePromise = (async () => {
            const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
            await runtimeHost.createDirectory(this.folder()); // Ensure directory exists
            const content = await (0, fs_js_1.tryReadText)(this.path());
            const entries = {};
            const objs = (await (0, jsonl_js_1.JSONLTryParse)(content)) ?? [];
            let numdup = 0; // Counter for duplicates
            for (const obj of objs) {
                if (entries[obj.sha])
                    numdup++; // Count duplicates
                entries[obj.sha] = obj;
            }
            if (2 * numdup > objs.length) {
                // Rewrite file if too many duplicates
                await (0, jsonl_js_1.writeJSONL)(this.path(), objs.filter((o) => entries[o.sha] === o));
            }
            // success
            super.initialize();
            this._entries = entries;
            this._initializePromise = undefined;
        })();
        return this._initializePromise;
    }
    async appendEntry(ent) {
        await (0, jsonl_js_1.appendJSONL)(this.path(), [ent]); // Append to file
    }
}
exports.JSONLineCache = JSONLineCache;
//# sourceMappingURL=jsonlinecache.js.map