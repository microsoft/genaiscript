import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { splitPrompt } from "./chatrenderterminal"

describe("splitPrompt", () => {
    test("should split on consecutive newlines", () => {
        const input = "This is a test.\n\nThis is another paragraph."
        const result = splitPrompt(input)
        assert.deepEqual(result, [
            "This is a test.",
            "This is another paragraph.",
        ])
    })

    test("should split on named markers", () => {
        const input = "Initial text\n<system>\nSystem instructions"
        const result = splitPrompt(input)
        assert.deepEqual(result, [
            "Initial text",
            "<system>",
            "System instructions",
        ])
    })

    test("should handle named markers at the beginning of text", () => {
        const input = "<user>\nThis is user input"
        const result = splitPrompt(input)
        assert.deepEqual(result, ["<user>", "This is user input"])
    })

    test("should handle multiple separators", () => {
        const input = "First part\n\nMiddle part\n<tool>\nTool output"
        const result = splitPrompt(input)
        assert.deepEqual(result, [
            "First part",
            "Middle part",
            "<tool>",
            "Tool output",
        ])
    })

    test("should filter empty strings", () => {
        const input = "\n\n<user>\n\n\nHello"
        const result = splitPrompt(input)
        assert.deepEqual(result, ["<user>", "Hello"])
    })

    test("should collapse consecutive newlines", () => {
        const input = "Line with\n\n\nmultiple\n\n\nnewlines"
        const result = splitPrompt(input)
        assert.deepEqual(result, ["Line with", "multiple", "newlines"])
    })
})
