import test, { describe } from "node:test"
import { HTMLTablesToJSON, HTMLToMarkdown, HTMLToText } from "./html"
import assert from "node:assert/strict"

describe("html", () => {
    test("convert HTML table to JSON", () => {
        const html = `
            <table>
                <tr>
                    <th>Header 1</th>
                    <th>Header 2</th>
                </tr>
                <tr>
                    <td>Value 1</td>
                    <td>Value 2</td>
                </tr>
            </table>
        `
        const expected = [{ "Header 1": "Value 1", "Header 2": "Value 2" }]
        const result = HTMLTablesToJSON(html)[0]
        console.log(JSON.stringify(result, null, 2))
        assert.deepStrictEqual(result, expected)
    })
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
