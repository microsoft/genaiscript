// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { tryReadJSON, writeText } from "./fs.js";
import { dotGenaiscriptPath } from "./workdir.js";
import { join } from "node:path";
import debug, { Debugger } from "debug";
import { errorMessage } from "./error.js";
import { rm, readdir } from "fs/promises";
import {
  CACHE_FORMAT_VERSION,
  CACHE_SHA_LENGTH,
  FILE_READ_CONCURRENCY_DEFAULT,
} from "./constants.js";
import { hash } from "./crypto.js";
import pLimit from "p-limit";
import type { HashOptions, WorkspaceFileCache } from "./types.js";

/**
 * A cache class stores each entry as a separate file in a directory.
 * It allows storage and retrieval of cache entries with unique SHA identifiers.
 * @template K - Type of the key
 * @template V - Type of the value
 */
export class FsCache<K, V> implements WorkspaceFileCache<any, any> {
  private hashOptions: HashOptions;
  private dbg: Debugger;

  // Constructor is private to enforce the use of byName factory method
  constructor(public readonly name: string) {
    this.dbg = debug(`genaiscript:cache:${name}`);
    this.hashOptions = {
      salt: CACHE_FORMAT_VERSION,
      length: CACHE_SHA_LENGTH,
    };
  }

  private cacheFilename(sha: string) {
    return join(this.folder(), sha + ".json");
  }

  async get(key: any): Promise<any> {
    if (key === undefined) return undefined; // Handle undefined key
    const sha = await this.getSha(key);
    const fn = this.cacheFilename(sha);
    const res = await tryReadJSON(fn);
    this.dbg(`get ${sha}: ${res !== undefined ? "hit" : "miss"}`);
    return res;
  }
  async set(key: any, value: any): Promise<void> {
    const sha = await this.getSha(key);
    const fn = this.cacheFilename(sha);
    try {
      if (value === undefined) await rm(fn);
      else await writeText(fn, JSON.stringify(value, null, 2));
      this.dbg(`set ${sha}: updated`);
    } catch (e) {
      this.dbg(`set ${sha}: failed (${errorMessage(e)})`);
    }
  }
  async values(): Promise<any[]> {
    try {
      const dir = this.folder();
      const files = await readdir(this.folder());
      const limit = pLimit(FILE_READ_CONCURRENCY_DEFAULT);
      return await Promise.all(
        files
          .filter((f) => /\.json$/.test(f))
          .map((f) => limit(() => tryReadJSON(join(dir, f))))
          .filter((f) => f !== undefined),
      );
    } catch (e) {
      this.dbg(`error while reading directory ${this.folder()}: ${errorMessage(e)}`);
      return [];
    }
  }

  async getOrUpdate(
    key: K,
    updater: () => Promise<V>,
    validator?: (val: V) => boolean,
  ): Promise<{ key: string; value: V; cached?: boolean }> {
    const sha = await this.getSha(key);
    const fn = this.cacheFilename(sha);
    const res = await tryReadJSON(fn);
    if (res) {
      this.dbg(`getup ${sha}: hit`);
      return { key: sha, value: res, cached: true };
    }
    const value = await updater();
    if (validator && validator(value)) {
      await this.set(key, value);
      this.dbg(`getup ${sha}: update`);
    } else this.dbg(`getup ${sha}: skip`);
    return { key: sha, value, cached: false };
  }

  // Get the folder path for the cache storage
  private folder() {
    return dotGenaiscriptPath("cache", this.name);
  }

  async getSha(key: K): Promise<string> {
    const sha = await hash(key, this.hashOptions);
    return sha;
  }
}
