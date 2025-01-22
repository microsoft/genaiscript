import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { convertThinkToMarkdown } from "./think"

describe("convertThinkToMarkdown", () => {
    test("should convert <think> tags to <details> tags", () => {
        const input = "<think>This is \na test</think>"
        const expected = "<details><summary>Thinking...</summary>This is \na test</details>"
        const result = convertThinkToMarkdown(input)
        assert.equal(result, expected)
    })

    test("should handle multiple <think> tags", () => {
        const input = "<think>First</think> and <think>Second</think>"
        const expected = "<details><summary>Thinking...</summary>First</details> and <details><summary>Thinking...</summary>Second</details>"
        const result = convertThinkToMarkdown(input)
        assert.equal(result, expected)
    })

    test("should handle <think> tags without closing tags", () => {
        const input = "<think>This is a test"
        const expected = "<details><summary>Thinking...</summary>This is a test</details>"
        const result = convertThinkToMarkdown(input)
        assert.equal(result, expected)
    })

    test("should return the same string if no <think> tags are present", () => {
        const input = "This is a test"
        const expected = "This is a test"
        const result = convertThinkToMarkdown(input)
        assert.equal(result, expected)
    })

    test("should return an empty string if input is empty", () => {
        const input = ""
        const expected = ""
        const result = convertThinkToMarkdown(input)
        assert.equal(result, expected)
    })
})