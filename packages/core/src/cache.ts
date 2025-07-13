// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FsCache } from "./fscache.js";
import { JSONLineCache } from "./jsonlinecache.js";
import { MemoryCache } from "./memcache.js";
import { host } from "./host.js";
import { CancellationOptions } from "./cancellation.js";
import debug from "debug";
import { sanitizeFilename } from "./sanitize.js";
import type { WorkspaceFileCache } from "./types.js";

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

export interface CreateCacheOptions {
  type: "memory" | "jsonl" | "fs";
  userState?: Record<string, unknown>;
  lookupOnly?: boolean;
}

function cacheNormalizeName(name: string) {
  return name ? sanitizeFilename(name.replace(/[^a-z0-9_]/gi, "_")) : undefined; // Sanitize name
}

export function createCache<K, V>(
  name: string,
  options: CreateCacheOptions & CancellationOptions,
): WorkspaceFileCache<K, V> {
  name = cacheNormalizeName(name); // Sanitize name
  if (!name) {
    dbg(`empty cache name`);
    return undefined;
  }

  const type = options?.type || "fs";
  const key = `cache:${type}:${name}`;
  const userState = options?.userState || host.userState;
  if (userState[key]) return userState[key] as WorkspaceFileCache<K, V>; // Return if exists
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
