"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FsCache = void 0;
const fs_js_1 = require("./fs.js");
const workdir_js_1 = require("./workdir.js");
const node_path_1 = require("node:path");
const debug_1 = __importDefault(require("debug"));
const error_js_1 = require("./error.js");
const promises_1 = require("fs/promises");
const constants_js_1 = require("./constants.js");
const crypto_js_1 = require("./crypto.js");
const p_limit_1 = __importDefault(require("p-limit"));
/**
 * A cache class stores each entry as a separate file in a directory.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
class FsCache {
    name;
    hashOptions;
    dbg;
    // Constructor is private to enforce the use of byName factory method
    constructor(name) {
        this.name = name;
        this.dbg = (0, debug_1.default)(`genaiscript:cache:${name}`);
        this.hashOptions = {
            salt: constants_js_1.CACHE_FORMAT_VERSION,
            length: constants_js_1.CACHE_SHA_LENGTH,
        };
    }
    cacheFilename(sha) {
        return (0, node_path_1.join)(this.folder(), sha + ".json");
    }
    async get(key) {
        if (key === undefined)
            return undefined; // Handle undefined key
        const sha = await this.getSha(key);
        const fn = this.cacheFilename(sha);
        const res = await (0, fs_js_1.tryReadJSON)(fn);
        this.dbg(`get ${sha}: ${res !== undefined ? "hit" : "miss"}`);
        return res;
    }
    async set(key, value) {
        const sha = await this.getSha(key);
        const fn = this.cacheFilename(sha);
        try {
            if (value === undefined)
                await (0, promises_1.rm)(fn);
            else
                await (0, fs_js_1.writeText)(fn, JSON.stringify(value, null, 2));
            this.dbg(`set ${sha}: updated`);
        }
        catch (e) {
            this.dbg(`set ${sha}: failed (${(0, error_js_1.errorMessage)(e)})`);
        }
    }
    async values() {
        try {
            const dir = this.folder();
            const files = await (0, promises_1.readdir)(this.folder());
            const limit = (0, p_limit_1.default)(constants_js_1.FILE_READ_CONCURRENCY_DEFAULT);
            return await Promise.all(files
                .filter((f) => /\.json$/.test(f))
                .map((f) => limit(() => (0, fs_js_1.tryReadJSON)((0, node_path_1.join)(dir, f))))
                .filter((f) => f !== undefined));
        }
        catch (e) {
            this.dbg(`error while reading directory ${this.folder()}: ${(0, error_js_1.errorMessage)(e)}`);
            return [];
        }
    }
    async getOrUpdate(key, updater, validator) {
        const sha = await this.getSha(key);
        const fn = this.cacheFilename(sha);
        const res = await (0, fs_js_1.tryReadJSON)(fn);
        if (res) {
            this.dbg(`getup ${sha}: hit`);
            return { key: sha, value: res, cached: true };
        }
        const value = await updater();
        if (validator && validator(value)) {
            await this.set(key, value);
            this.dbg(`getup ${sha}: update`);
        }
        else
            this.dbg(`getup ${sha}: skip`);
        return { key: sha, value, cached: false };
    }
    // Get the folder path for the cache storage
    folder() {
        return (0, workdir_js_1.dotGenaiscriptPath)("cache", this.name);
    }
    async getSha(key) {
        const sha = await (0, crypto_js_1.hash)(key, this.hashOptions);
        return sha;
    }
}
exports.FsCache = FsCache;
//# sourceMappingURL=fscache.js.map