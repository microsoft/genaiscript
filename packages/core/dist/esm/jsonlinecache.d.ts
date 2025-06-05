import { CacheEntry } from "./cache.js";
import { MemoryCache } from "./memcache.js";
/**
 * A cache class that manages entries stored in JSONL format.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export declare class JSONLineCache<K, V> extends MemoryCache<K, V> {
  readonly name: string;
  constructor(name: string);
  private folder;
  private path;
  private _initializePromise;
  /**
   * Initialize the cache by loading entries from the file.
   * Identifies duplicate entries and rewrites the file if necessary.
   */
  initialize(): Promise<void>;
  appendEntry(ent: CacheEntry<V>): Promise<void>;
}
//# sourceMappingURL=jsonlinecache.d.ts.map
