import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { TestHost } from "./testhost";
import { JSONLineCache } from "./jsonlinecache";
import { createCache } from "./cache";

const tempDir = path.join(".genaiscript", "temp");

for (const type of ["memory", "jsonl", "fs"]) {
  describe(`cache.${type}`, () => {
    beforeEach(async () => {
      TestHost.install();
      await fs.mkdir(tempDir, { recursive: true });
    });
    test("instance creation with byName", async () => {
      const cache = createCache<string, number>("testCache", {
        type: type as any,
      });
      assert.ok(!!cache);
    });
    test("set key-value pair", async () => {
      const cache = createCache<string, number>("testCache", {
        type: type as any,
      });
      await cache.set("anotherKey", 99);
      const value = await cache.get("anotherKey");
      assert.strictEqual(value, 99);
    });

    test("getSha computation", async () => {
      const cache = createCache<string, number>("testCache", {
        type: type as any,
      });
      const sha = await cache.getSha("testKey");
      assert.ok(sha);
      assert.strictEqual(typeof sha, "string");
    });

    test("keySHA generates SHA256 hash from a key", async () => {
      const cache = createCache<string, number>("testCache", {
        type: type as any,
      });
      const sha = await cache.getSha("testKey");
      assert.ok(sha);
      assert.strictEqual(typeof sha, "string");
    });
    test(`${type} getOrUpdate retrieves existing value`, async () => {
      const cache = createCache<string, number>("testCache", {
        type: type as any,
      });
      await cache.set("existingKey", 42);
      const value = await cache.getOrUpdate(
        "existingKey",
        async () => 99,
        () => true,
      );
      assert.strictEqual(value.value, 42);
    });

    test("getOrUpdate updates with new value if key does not exist", async () => {
      const cache = createCache<string, number>("testCache", {
        type: type as any,
      });
      const value = await cache.getOrUpdate(
        "newKey",
        async () => 99,
        () => true,
      );
      assert.strictEqual(value.value, 99);
      const cachedValue = await cache.get("newKey");
      assert.strictEqual(cachedValue, 99);
    });

    test("values() retrieves all stored values", async () => {
      const cache = createCache<string, number>("testCache", {
        type: type as any,
      });
      await cache.set("key1", 10);
      await cache.set("key2", 20);
      await cache.set("key3", 30);

      const values = await cache.values();
      assert(values.includes(10));
      assert(values.includes(20));
      assert(values.includes(30));
    });
  });
}
