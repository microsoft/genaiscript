import { FsCache } from "./fscache";
import { JSONLineCache } from "./jsonlinecache";
import { MemoryCache } from "./memcache";
import { host } from "./host";
import { NotSupportedError } from "./error";
import { CancellationOptions } from "./cancellation";
import debug from "debug";
import { sanitizeFilename } from "./sanitize";
const dbg = debug("genaiscript:cache");

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

function cacheNormalizeName(name: string) {
  return name ? sanitizeFilename(name.replace(/[^a-z0-9_]/gi, "_")) : undefined; // Sanitize name
}

export function createCache<K, V>(
  name: string,
  options: CacheOptions & CancellationOptions,
): WorkspaceFileCache<K, V> {
  name = cacheNormalizeName(name); // Sanitize name
  if (!name) {
    dbg(`empty cache name`);
    return undefined;
  }

  const type = options?.type || "fs";
  const key = `cache:${type}:${name}`;
  const userState = options?.userState || host.userState;
  if (userState[key]) return userState[key]; // Return if exists
  if (options?.lookupOnly) return undefined;

  dbg(`creating ${name} ${type}`);
  let r: WorkspaceFileCache<K, V>;
  switch (type) {
    case "memory":
      r = new MemoryCache<K, V>(name);
      break;
    case "jsonl":
      r = new JSONLineCache<K, V>(name);
      break;
    default:
      r = new FsCache<K, V>(name);
      break;
  }

  userState[key] = r;
  return r;
}
