import { JSONLineCache, CacheEntry } from "./cache"
import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { TestHost } from "./testhost"

const tempDir = path.join(".genaiscript", "temp")

describe("Cache", () => {
    beforeEach(async () => {
        TestHost.install()
        await fs.mkdir(tempDir, { recursive: true })
    })
    test("JSONLineCache instance creation with byName", async () => {
        const cache = JSONLineCache.byName<string, number>("testCache")
        assert.ok(cache instanceof JSONLineCache)
    })
    test("JSONLineCache set key-value pair", async () => {
        const cache = JSONLineCache.byName<string, number>("testCache")
        await cache.set("anotherKey", 99)
        const value = await cache.get("anotherKey")
        assert.strictEqual(value, 99)
    })

    test("JSONLineCache getKeySHA computation", async () => {
        const cache = JSONLineCache.byName<string, number>("testCache")
        const sha = await cache.getKeySHA("testKey")
        assert.ok(sha)
        assert.strictEqual(typeof sha, "string")
    })

    test("keySHA generates SHA256 hash from a key", async () => {
        const cache = JSONLineCache.byName<string, number>("testCache")
        const sha = await cache.getKeySHA("testKey")
        assert.ok(sha)
        assert.strictEqual(typeof sha, "string")
    })
})
