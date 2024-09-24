// Import necessary modules and types
import { appendJSONL, readJSONL, writeJSONL } from "./jsonl"
import { host, runtimeHost } from "./host"
import { dotGenaiscriptPath, sha256string } from "./util"
import { CHANGE } from "./constants"
import { TraceOptions } from "./trace"
import { CORE_VERSION } from "./version"

/**
 * Represents a cache entry with a hashed identifier (`sha`), `key`, and `val`.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export type CacheEntry<K, V> = { sha: string; key: K; val: V }

/**
 * A cache class that manages entries stored in JSONL format.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export class JSONLineCache<K, V> extends EventTarget {
    private _entries: Record<string, CacheEntry<K, V>>

    // Constructor is private to enforce the use of byName factory method
    private constructor(public readonly name: string) {
        super() // Initialize EventTarget
    }

    /**
     * Factory method to create or retrieve an existing cache by name.
     * Sanitizes the name to ensure it is a valid identifier.
     * @param name - The name of the cache
     * @returns An instance of JSONLineCache
     */
    static byName<K, V>(name: string): JSONLineCache<K, V> {
        name = name.replace(/[^a-z0-9_]/gi, "_") // Sanitize name
        const key = "cacheKV." + name
        if (host.userState[key]) return host.userState[key] // Return if exists
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

    /**
     * Initialize the cache by loading entries from the file.
     * Identifies duplicate entries and rewrites the file if necessary.
     */
    private async initialize() {
        if (this._entries) return
        this._entries = {}
        await host.createDirectory(this.folder()) // Ensure directory exists
        const objs: CacheEntry<K, V>[] = await readJSONL(this.path())
        let numdup = 0 // Counter for duplicates
        for (const obj of objs) {
            if (this._entries[obj.sha]) numdup++ // Count duplicates
            this._entries[obj.sha] = obj
        }
        if (2 * numdup > objs.length) {
            // Rewrite file if too many duplicates
            await writeJSONL(
                this.path(),
                objs.filter((o) => this._entries[o.sha] === o) // Preserve order
            )
        }
    }

    /**
     * Retrieve all keys from the cache.
     * @returns A promise resolving to an array of keys
     */
    async keys(): Promise<K[]> {
        await this.initialize()
        return Object.values(this._entries).map((kv) => kv.key)
    }

    /**
     * Retrieve all entries from the cache.
     * @returns A promise resolving to an array of cache entries
     */
    async entries(): Promise<CacheEntry<K, V>[]> {
        await this.initialize()
        return Object.values(this._entries).map((e) => ({ ...e }))
    }

    /**
     * Retrieve a specific entry by its SHA identifier.
     * @param sha - The SHA identifier of the entry
     * @returns A promise resolving to the cache entry
     */
    async getEntryBySha(sha: string) {
        await this.initialize()
        return this._entries[sha]
    }

    /**
     * Get the value associated with a specific key.
     * @param key - The key of the entry
     * @returns A promise resolving to the value
     */
    async get(key: K): Promise<V> {
        if (key === undefined) return undefined // Handle undefined key
        await this.initialize()
        const sha = await keySHA(key)
        return this._entries[sha]?.val
    }

    /**
     * Set a key-value pair in the cache, triggering a change event.
     * @param key - The key to set
     * @param val - The value to set
     * @param options - Optional trace options
     */
    async set(key: K, val: V, options?: TraceOptions) {
        const { trace } = options || {}
        await this.initialize()
        const sha = await keySHA(key)
        const ent = { sha, key, val }
        const ex = this._entries[sha]
        if (ex && JSON.stringify(ex) == JSON.stringify(ent)) return // No change
        this._entries[sha] = ent
        await appendJSONL(this.path(), [ent]) // Append to file
        trace?.item(`cache ${this.name} set`)
        this.dispatchEvent(new Event(CHANGE)) // Notify listeners
    }

    /**
     * Compute SHA for a given key.
     * @param key - The key to compute SHA for
     * @returns A promise resolving to the SHA string
     */
    async getKeySHA(key: K) {
        await this.initialize()
        const sha = await keySHA(key)
        return sha
    }
}

/**
 * Compute the SHA256 hash of a key for uniqueness.
 * Normalizes the key by converting it to a string and appending the core version.
 * @param key - The key to hash
 * @returns A promise resolving to the SHA256 hash string
 */
async function keySHA(key: any) {
    if (typeof key != "string") key = JSON.stringify(key) + CORE_VERSION // Normalize key
    return await sha256string(key)
}
