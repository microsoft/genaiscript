// Import necessary modules and types
import { host } from "./host"
import { CACHE_FORMAT_VERSION, CACHE_SHA_LENGTH, CHANGE } from "./constants"
import { hash } from "./crypto"
import type { CacheEntry } from "./cache"

/**
 * A cache class that manages entries stored in JSONL format.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export class MemoryCache<K, V>
    extends EventTarget
    implements WorkspaceFileCache<any, any>
{
    protected _entries: Record<string, CacheEntry<V>>
    private _pending: Record<string, Promise<V>>
    private readonly hashOptions: HashOptions

    // Constructor is private to enforce the use of byName factory method
    constructor(public readonly name: string) {
        super() // Initialize EventTarget
        this.hashOptions = {
            salt: CACHE_FORMAT_VERSION,
            length: CACHE_SHA_LENGTH,
        } satisfies HashOptions
    }

    protected async initialize() {
        if (this._entries) return
        this._entries = {}
        this._pending = {}
    }

    /**
     * Retrieve all values from the cache.
     * @returns
     */
    async values(): Promise<V[]> {
        await this.initialize()
        return Object.values(this._entries).map((kv) => kv.val)
    }

    /**
     * Retrieve all entries from the cache.
     * @returns A promise resolving to an array of cache entries
     */
    async entries(): Promise<CacheEntry<V>[]> {
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
        const sha = await this.getSha(key)
        return this._entries[sha]?.val
    }

    async getOrUpdate(
        key: K,
        updater: () => Promise<V>,
        validator?: (val: V) => boolean
    ): Promise<{ key: string; value: V; cached?: boolean }> {
        await this.initialize()
        const sha = await hash(key)
        if (this._entries[sha])
            return { key: sha, value: this._entries[sha].val, cached: true }
        if (this._pending[sha])
            return { key: sha, value: await this._pending[sha], cached: true }

        try {
            const p = updater()
            this._pending[sha] = p
            const value = await p
            if (!validator || validator(value)) await this.set(key, value)
            return { key: sha, value, cached: false }
        } finally {
            delete this._pending[sha]
        }
    }

    protected async appendEntry(entry: CacheEntry<V>) {}

    /**
     * Set a key-value pair in the cache, triggering a change event.
     * @param key - The key to set
     * @param val - The value to set
     * @param options - Optional trace options
     */
    async set(key: K, val: V) {
        await this.initialize()
        const sha = await this.getSha(key)
        const ent = { sha, val } satisfies CacheEntry<V>
        const ex = this._entries[sha]
        if (ex && JSON.stringify(ex) == JSON.stringify(ent)) return // No change
        this._entries[sha] = ent
        await this.appendEntry(ent)
        this.dispatchEvent(new Event(CHANGE)) // Notify listeners
    }

    /**
     * Compute SHA for a given key.
     * @param key - The key to compute SHA for
     * @returns A promise resolving to the SHA string
     */
    async getSha(key: K) {
        const sha = await hash(key, this.hashOptions)
        return sha
    }
}
