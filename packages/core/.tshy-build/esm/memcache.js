// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { CACHE_FORMAT_VERSION, CACHE_SHA_LENGTH, CHANGE } from "./constants.js";
import { hash } from "./crypto.js";
import debug from "debug";
/**
 * A cache class that manages entries stored in JSONL format.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export class MemoryCache extends EventTarget {
    name;
    _entries;
    _pending;
    hashOptions;
    dbg;
    // Constructor is private to enforce the use of byName factory method
    constructor(name) {
        super(); // Initialize EventTarget
        this.name = name;
        this.dbg = debug(`genaiscript:cache:${name}`); // Initialize debugger
        this.hashOptions = {
            salt: CACHE_FORMAT_VERSION,
            length: CACHE_SHA_LENGTH,
        };
    }
    async initialize() {
        if (this._entries)
            return;
        this._entries = {};
        this._pending = {};
    }
    /**
     * Retrieve all values from the cache.
     * @returns
     */
    async values() {
        await this.initialize();
        return Object.values(this._entries).map((kv) => kv.val);
    }
    /**
     * Get the value associated with a specific key.
     * @param key - The key of the entry
     * @returns A promise resolving to the value
     */
    async get(key) {
        if (key === undefined)
            return undefined; // Handle undefined key
        await this.initialize();
        const sha = await this.getSha(key);
        const res = this._entries[sha]?.val;
        this.dbg(`get ${sha}: ${res !== undefined ? "hit" : "miss"}`);
        return res;
    }
    async getOrUpdate(key, updater, validator) {
        await this.initialize();
        const sha = await this.getSha(key);
        if (this._entries[sha]) {
            this.dbg(`getup ${sha}: hit`);
            return { key: sha, value: this._entries[sha].val, cached: true };
        }
        if (this._pending[sha]) {
            this.dbg(`getup ${sha}: hit (pending)`);
            return { key: sha, value: await this._pending[sha], cached: true };
        }
        try {
            const p = updater();
            this._pending[sha] = p;
            const value = await p;
            if (!validator || validator(value)) {
                await this.set(key, value);
                this.dbg(`set ${sha}: updated`);
            }
            return { key: sha, value, cached: false };
        }
        finally {
            delete this._pending[sha];
        }
    }
    async appendEntry(entry) { }
    /**
     * Set a key-value pair in the cache, triggering a change event.
     * @param key - The key to set
     * @param val - The value to set
     * @param options - Optional trace options
     */
    async set(key, val) {
        await this.initialize();
        const sha = await this.getSha(key);
        const ent = { sha, val };
        const ex = this._entries[sha];
        if (ex !== undefined && JSON.stringify(ex) == JSON.stringify(ent))
            return; // No change
        this._entries[sha] = ent;
        await this.appendEntry(ent);
        this.dispatchEvent(new Event(CHANGE)); // Notify listeners
        this.dbg(`set ${sha}: updated`);
    }
    /**
     * Compute SHA for a given key.
     * @param key - The key to compute SHA for
     * @returns A promise resolving to the SHA string
     */
    async getSha(key) {
        const sha = await hash(key, this.hashOptions);
        return sha;
    }
}
//# sourceMappingURL=memcache.js.map