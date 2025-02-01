import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { convertThinkToMarkdown, unthink } from "./think"

describe("convertThinkToMarkdown", () => {
    test("should convert <think> tags to <details> tags", () => {
        const input = "<think>This is \na test</think>"
        const expected =
            "\n<details><summary>🤔 think</summary>This is \na test</details>\n"
        const result = convertThinkToMarkdown(input)
        assert.equal(result, expected)
    })

    test("should handle multiple <think> tags", () => {
        const input = "<think>First</think> and <think>Second</think>"
        const expected =
            "\n<details><summary>🤔 think</summary>First</details>\n and \n<details><summary>🤔 think</summary>Second</details>\n"
        const result = convertThinkToMarkdown(input)
        assert.equal(result, expected)
    })

    test("should handle <think> tags without closing tags", () => {
        const input = "<think>This is a test"
        const expected =
            "\n<details><summary>🤔 thinking...</summary>This is a test</details>\n"
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
describe("eraseThink", () => {
    test("should remove <think> tags and their content", () => {
        const input = "<think>This is \na test</think>"
        const expected = ""
        const result = unthink(input)
        assert.equal(result, expected)
    })

    test("should handle multiple <think> tags", () => {
        const input = "<think>First</think> and <think>Second</think>"
        const expected = " and "
        const result = unthink(input)
        assert.equal(result, expected)
    })

    test("should handle <think> tags without closing tags", () => {
        const input = "<think>This is a test"
        const expected = ""
        const result = unthink(input)
        assert.equal(result, expected)
    })

    test("should return the same string if no <think> tags are present", () => {
        const input = "This is a test"
        const expected = "This is a test"
        const result = unthink(input)
        assert.equal(result, expected)
    })

    test("should return an empty string if input is empty", () => {
        const input = ""
        const expected = ""
        const result = unthink(input)
        assert.equal(result, expected)
    })
})
