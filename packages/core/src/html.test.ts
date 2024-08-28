import test, { describe } from "node:test"
import { HTMLToMarkdown, HTMLToText } from "./html"
import assert from "node:assert/strict"

describe("html", () => {
    test("converts HTML to text", () => {
        const html = "<p>Hello, world!</p>"
        const expected = "Hello, world!"
        const result = HTMLToText(html)
        assert(result === expected)
    })

    describe("HTMLToMarkdown", () => {
        test("converts simple HTML to Markdown", async () => {
            const html = "<h1>Title</h1>"
            const expected = "Title\n====="
            const result = HTMLToMarkdown(html)
            assert.strictEqual(result, expected)
        })
    })
})
