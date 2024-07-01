import { sentiment } from "./transformers"
import { readFile } from "fs/promises"
import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { TestHost } from "./testhost"

describe("sentiment function", () => {
    beforeEach(() => {
        TestHost.install()
    })
    test("should process love", async () => {
        const result = await sentiment("i love u")
        assert.strictEqual(result.label, "POSITIVE")
        assert(result.score > 0.9)
    })
})
