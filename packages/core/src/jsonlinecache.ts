// Import necessary modules and types
import { appendJSONL, JSONLTryParse, writeJSONL } from "./jsonl";
import { host } from "./host";
import { tryReadText } from "./fs";
import { dotGenaiscriptPath } from "./workdir";
import { CacheEntry } from "./cache";
import { MemoryCache } from "./memcache";

/**
 * A cache class that manages entries stored in JSONL format.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export class JSONLineCache<K, V> extends MemoryCache<K, V> {
  // Constructor is private to enforce the use of byName factory method
  constructor(public readonly name: string) {
    super(name); // Initialize EventTarget
  }

  // Get the folder path for the cache storage
  private folder() {
    return dotGenaiscriptPath("cache", this.name);
  }

  // Get the full path to the cache file
  private path() {
    return host.resolvePath(this.folder(), "db.jsonl");
  }

  private _initializePromise: Promise<void>;
  /**
   * Initialize the cache by loading entries from the file.
   * Identifies duplicate entries and rewrites the file if necessary.
   */
  override async initialize() {
    if (this._entries) return;
    if (this._initializePromise) return await this._initializePromise;

    this._initializePromise = (async () => {
      await host.createDirectory(this.folder()); // Ensure directory exists
      const content = await tryReadText(this.path());
      const entries: Record<string, CacheEntry<V>> = {};
      const objs: CacheEntry<V>[] = (await JSONLTryParse(content)) ?? [];
      let numdup = 0; // Counter for duplicates
      for (const obj of objs) {
        if (entries[obj.sha]) numdup++; // Count duplicates
        entries[obj.sha] = obj;
      }
      if (2 * numdup > objs.length) {
        // Rewrite file if too many duplicates
        await writeJSONL(
          this.path(),
          objs.filter((o) => entries[o.sha] === o), // Preserve order
        );
      }
      // success
      super.initialize();
      this._entries = entries;
      this._initializePromise = undefined;
    })();
    return this._initializePromise;
  }

  override async appendEntry(ent: CacheEntry<V>) {
    await appendJSONL(this.path(), [ent]); // Append to file
  }
}
