import test, { describe } from "node:test"
import assert from "node:assert"
import { resolveTokenEncoder } from "./encoders"
import { encode as defaultEncode } from "gpt-tokenizer"

describe("resolveTokenEncoder", () => {
    test("gpt-3.5-turbo", async () => {
        const encoder = await resolveTokenEncoder("gpt-3.5-turbo")
        const result = encoder("test line")
        assert.deepEqual(result, [1985, 1584])
    })
    test("gpt-4", async () => {
        const encoder = await resolveTokenEncoder("gpt-4")
        const result = encoder("test line")
        assert.deepEqual(result, [1985, 1584])
    })
    test("gpt-4o", async () => {
        const encoder = await resolveTokenEncoder("gpt-4o")
        const result = encoder("test line")
        assert.deepEqual(result, [3190, 2543])
    })
    test("gpt-4o-mini", async () => {
        const encoder = await resolveTokenEncoder("gpt-4o-mini")
        const result = encoder("test line")
        assert.deepEqual(result, [3190, 2543])
    })
    test("gpt-4o forbidden", async () => {
        const encoder = await resolveTokenEncoder("gpt-4o")
        const result = encoder("<|im_end|>")
        assert.deepEqual(result, [27, 91, 321, 13707, 91, 29])
    })
})
