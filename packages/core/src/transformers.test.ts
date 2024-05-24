import { sentiment } from "./transformers"
import { readFile } from "fs/promises"
import { describe, test } from "node:test"
import assert from "node:assert/strict"

describe("sentiment function", () => {
    test("should process love", async () => {
        const result = await sentiment("i love u")
        assert.strictEqual(result.label, "POSITIVE")
        assert(result.score > 0.9)
    })
})
