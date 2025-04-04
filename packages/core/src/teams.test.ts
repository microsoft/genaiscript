import { convertMarkdownToTeamsHTML } from "./teams"
import { describe, test } from "node:test"
import assert from "node:assert/strict"

describe("convertMarkdownToTeamsHTML", () => {
    test("converts headers correctly", () => {
        const markdown =
            "# Subject\n## Heading 1\n### Heading 2\n#### Heading 3"
        const result = convertMarkdownToTeamsHTML(markdown)
        assert.strictEqual(result.subject, "Subject")
        assert.strictEqual(
            result.content,
            "<div>\n<h1>Heading 1</h1>\n<h2>Heading 2</h2>\n<h3>Heading 3</h3></div>"
        )
    })

    test("converts bold, italic, code, and strike correctly", () => {
        const markdown = "**bold** *italic* `code` ~~strike~~"
        const result = convertMarkdownToTeamsHTML(markdown)
        assert.strictEqual(
            result.content,
            "<div><b>bold</b> <i>italic</i> <code>code</code> <strike>strike</strike></div>"
        )
    })

    test("converts blockquotes correctly", () => {
        const markdown = "> This is a blockquote"
        const result = convertMarkdownToTeamsHTML(markdown)
        assert.strictEqual(
            result.content,
            "<div><blockquote>This is a blockquote</blockquote>\n</div>"
        )
    })
    test("handles empty markdown string", () => {
        const markdown = ""
        const result = convertMarkdownToTeamsHTML(markdown)
        assert.strictEqual(result.content, "<div></div>")
        assert.strictEqual(result.subject, undefined)
    })

    test("handles markdown without subject", () => {
        const markdown = "## Heading 1\nContent"
        const result = convertMarkdownToTeamsHTML(markdown)
        assert.strictEqual(result.subject, undefined)
        assert.strictEqual(
            result.content,
            "<div><h1>Heading 1</h1>\nContent</div>"
        )
    })
    test("converts unordered lists correctly", () => {
        const markdown = "- Item 1\n- Item 2\n- Item 3"
        const result = convertMarkdownToTeamsHTML(markdown)
        assert.strictEqual(
            result.content,
            "<div><br/>- Item 1\n<br/>- Item 2\n<br/>- Item 3</div>"
        )
    })

    test("converts mixed content correctly", () => {
        const markdown =
            "# Subject\n## Heading 1\nContent with **bold**, *italic*, `code`, and ~~strike~~.\n- List item 1\n- List item 2\n> Blockquote"
        const result = convertMarkdownToTeamsHTML(markdown)
        assert.strictEqual(result.subject, "Subject")
        assert.strictEqual(
            result.content,
            "<div>\n<h1>Heading 1</h1>\nContent with <b>bold</b>, <i>italic</i>, <code>code</code>, and <strike>strike</strike>.\n<br/>- List item 1\n<br/>- List item 2\n<blockquote>Blockquote</blockquote>\n</div>"
        )
    })

    test("converts multiple paragraphs correctly", () => {
        const markdown = "Paragraph 1\n\nParagraph 2"
        const result = convertMarkdownToTeamsHTML(markdown)
        assert.strictEqual(
            result.content,
            "<div>Paragraph 1\n\nParagraph 2</div>"
        )
    })
})
