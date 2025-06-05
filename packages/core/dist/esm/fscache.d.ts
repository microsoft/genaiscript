/**
 * A cache class stores each entry as a separate file in a directory.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export declare class FsCache<K, V> implements WorkspaceFileCache<any, any> {
  readonly name: string;
  private hashOptions;
  private dbg;
  constructor(name: string);
  private cacheFilename;
  get(key: any): Promise<any>;
  set(key: any, value: any): Promise<void>;
  values(): Promise<any[]>;
  getOrUpdate(
    key: K,
    updater: () => Promise<V>,
    validator?: (val: V) => boolean,
  ): Promise<{
    key: string;
    value: V;
    cached?: boolean;
  }>;
  private folder;
  getSha(key: K): Promise<string>;
}
//# sourceMappingURL=fscache.d.ts.map
