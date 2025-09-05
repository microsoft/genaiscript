import { describe, test } from "node:test"
import assert from "node:assert/strict"

describe("Simple test", async () => {
    test("basic assertion", async () => {
        const result = 1 + 1
        assert.strictEqual(result, 2)
    })

    test("string test", async () => {
        const str = "test"
        assert.strictEqual(str.length, 4)
    })
})