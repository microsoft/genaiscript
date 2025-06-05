import { CancellationOptions } from "./cancellation.js";
/**
 * Represents a cache entry with a hashed identifier (`sha`), `key`, and `val`.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export interface CacheEntry<V> {
  sha: string;
  val: V;
}
export interface CacheOptions {
  type: "memory" | "jsonl" | "fs";
  userState?: Record<string, any>;
  lookupOnly?: boolean;
}
export declare function createCache<K, V>(
  name: string,
  options: CacheOptions & CancellationOptions,
): WorkspaceFileCache<K, V>;
//# sourceMappingURL=cache.d.ts.map
