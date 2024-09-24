import { appendJSONL, readJSONL, writeJSONL } from "./jsonl"
import { host, runtimeHost } from "./host"
import { dotGenaiscriptPath, sha256string } from "./util"
import { CHANGE } from "./constants"
import { TraceOptions } from "./trace"
import { CORE_VERSION } from "./version"

// Represents a cache entry with a hashed identifier, key, and value
export type CacheEntry<K, V> = { sha: string; key: K; val: V }

// A cache class that manages entries stored in JSONL format
export class JSONLineCache<K, V> extends EventTarget {
    private _entries: Record<string, CacheEntry<K, V>>
    // Constructor is private to enforce the use of byName factory method
    private constructor(public readonly name: string) {
        super()
    }

    // Factory method to create or retrieve an existing cache by name
    static byName<K, V>(name: string): JSONLineCache<K, V> {
        name = name.replace(/[^a-z0-9_]/gi, "_") // Sanitize name to valid identifier
        const key = "cacheKV." + name
        if (host.userState[key]) return host.userState[key] // Return if already exists
        const r = new JSONLineCache<K, V>(name)
        host.userState[key] = r
        return r
    }

    // Get the folder path for the cache storage
    private folder() {
        return dotGenaiscriptPath("cache", this.name)
    }
    // Get the full path to the cache file
    private path() {
        return host.resolvePath(this.folder(), "db.jsonl")
    }
    // Initialize the cache by loading entries from the file
    private async initialize() {
        if (this._entries) return
        this._entries = {}
        await host.createDirectory(this.folder())
        const objs: CacheEntry<K, V>[] = await readJSONL(this.path())
        let numdup = 0
        for (const obj of objs) {
            if (this._entries[obj.sha]) numdup++ // Count duplicates
            this._entries[obj.sha] = obj
        }
        if (2 * numdup > objs.length) {
            // Rewrite file if too many duplicates; preserves entry order
            // if too many duplicates, rewrite the file
            // keep the order of entries
            await writeJSONL(
                this.path(),
                objs.filter((o) => this._entries[o.sha] === o)
            )
        }
    }

    // Retrieve all keys from the cache
    async keys(): Promise<K[]> {
        await this.initialize()
        return Object.values(this._entries).map((kv) => kv.key)
    }
    // Retrieve all entries from the cache
    async entries(): Promise<CacheEntry<K, V>[]> {
        await this.initialize()
        return Object.values(this._entries).map((e) => ({ ...e }))
    }
    // Retrieve a specific entry by its SHA identifier
    async getEntryBySha(sha: string) {
        await this.initialize()
        return this._entries[sha]
    }
    // Get the value associated with a specific key
    async get(key: K): Promise<V> {
        if (key === undefined) return undefined
        await this.initialize()
        const sha = await keySHA(key)
        return this._entries[sha]?.val
    }
    // Set a key-value pair in the cache, triggering change event
    async set(key: K, val: V, options?: TraceOptions) {
        const { trace } = options || {}
        await this.initialize()
        const sha = await keySHA(key)
        const ent = { sha, key, val }
        const ex = this._entries[sha]
        if (ex && JSON.stringify(ex) == JSON.stringify(ent)) return // No change
        this._entries[sha] = ent
        await appendJSONL(this.path(), [ent]) // Append new entry to file
        trace?.item(`cache ${this.name} set`)
        this.dispatchEvent(new Event(CHANGE)) // Notify listeners of change
    }
    // Compute SHA for a given key
    async getKeySHA(key: K) {
        await this.initialize()
        const sha = await keySHA(key)
        return sha
    }
}
// Compute the SHA256 hash of a key for uniqueness
async function keySHA(key: any) {
    if (typeof key != "string") key = JSON.stringify(key) + CORE_VERSION // Normalize key
    return await sha256string(key)
}
