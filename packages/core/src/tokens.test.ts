import {
    approximateTokens,
    estimateTokens,
    truncateTextToTokens,
} from "./tokens"
import { describe, it } from "node:test"
import assert from "assert"

describe("approximateTokens", () => {
    it("should return 0 for empty text", () => {
        assert.strictEqual(approximateTokens(""), 0)
    })

    it("should normalize whitespace", () => {
        const text = "hello   world"
        const normalizedText = "hello world"
        assert.strictEqual(
            approximateTokens(text),
            approximateTokens(normalizedText)
        )
    })

    it("should consider punctuation in estimation", () => {
        const textWithoutPunctuation = "hello world"
        const textWithPunctuation = "hello, world!"
        assert(
            approximateTokens(textWithPunctuation) >
                approximateTokens(textWithoutPunctuation)
        )
    })
})
