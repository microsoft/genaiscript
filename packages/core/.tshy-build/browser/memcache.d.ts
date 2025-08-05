import type { CacheEntry } from "./cache.js";
import type { Debugger } from "debug";
import type { WorkspaceFileCache } from "./types.js";
/**
 * A cache class that manages entries stored in JSONL format.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export declare class MemoryCache<K, V> extends EventTarget implements WorkspaceFileCache<any, any> {
    readonly name: string;
    protected _entries: Record<string, CacheEntry<V>>;
    private _pending;
    private readonly hashOptions;
    protected dbg: Debugger;
    constructor(name: string);
    protected initialize(): Promise<void>;
    /**
     * Retrieve all values from the cache.
     * @returns
     */
    values(): Promise<V[]>;
    /**
     * Get the value associated with a specific key.
     * @param key - The key of the entry
     * @returns A promise resolving to the value
     */
    get(key: K): Promise<V>;
    getOrUpdate(key: K, updater: () => Promise<V>, validator?: (val: V) => boolean): Promise<{
        key: string;
        value: V;
        cached?: boolean;
    }>;
    protected appendEntry(entry: CacheEntry<V>): Promise<void>;
    /**
     * Set a key-value pair in the cache, triggering a change event.
     * @param key - The key to set
     * @param val - The value to set
     * @param options - Optional trace options
     */
    set(key: K, val: V): Promise<void>;
    /**
     * Compute SHA for a given key.
     * @param key - The key to compute SHA for
     * @returns A promise resolving to the SHA string
     */
    getSha(key: K): Promise<string>;
}
//# sourceMappingURL=memcache.d.ts.map