import test, { describe } from "node:test"
import { HTMLToText } from "./html"
import assert from "node:assert/strict"

describe("html", () => {
    test("converts HTML to text", () => {
        const html = "<p>Hello, world!</p>"
        const expected = "Hello, world!"
        const result = HTMLToText(html)
        assert(result === expected)
    })
})
