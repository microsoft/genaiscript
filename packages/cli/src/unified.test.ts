import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {
    parseMarkdownToMdast,
    processMarkdownWithMdast,
    stringifyMdast,
    containsHtmlComments,
    removeHtmlComments,
    type MdastRoot,
} from "./runtime"

describe("unified mdast", () => {
    const markdownWithComments = `# Hello World

This is a paragraph.

<!-- This is an HTML comment -->

## Section 2

Another paragraph.

<!-- Another comment with
multiple lines -->

Some **bold** text.`

    const markdownWithoutComments = `# Hello World

This is a paragraph.

## Section 2

Another paragraph.

Some **bold** text.`

    test("parseMarkdownToMdast creates valid mdast", () => {
        const tree = parseMarkdownToMdast("# Hello\n\nWorld")
        assert.strictEqual(tree.type, "root")
        assert(Array.isArray(tree.children))
        assert(tree.children.length > 0)
    })

    test("containsHtmlComments detects comments", () => {
        assert.strictEqual(containsHtmlComments(markdownWithComments), true)
        assert.strictEqual(containsHtmlComments(markdownWithoutComments), false)
        assert.strictEqual(containsHtmlComments("No comments here"), false)
        assert.strictEqual(containsHtmlComments("<!-- Single comment -->"), true)
    })

    test("processMarkdownWithMdast preserves content by default", () => {
        const result = processMarkdownWithMdast(markdownWithComments)
        assert(containsHtmlComments(result))
    })

    test("processMarkdownWithMdast removes comments when ignoreHtmlComments=true", () => {
        const result = processMarkdownWithMdast(markdownWithComments, {
            ignoreHtmlComments: true,
        })
        assert.strictEqual(containsHtmlComments(result), false)
        assert(result.includes("# Hello World"))
        assert(result.includes("## Section 2"))
        assert(result.includes("Some **bold** text"))
    })

    test("removeHtmlComments convenience function", () => {
        const result = removeHtmlComments(markdownWithComments)
        assert.strictEqual(containsHtmlComments(result), false)
        assert(result.includes("# Hello World"))
        assert(result.includes("Some **bold** text"))
    })

    test("parseMarkdownToMdast with ignoreHtmlComments option", () => {
        const tree = parseMarkdownToMdast(markdownWithComments, {
            ignoreHtmlComments: true,
        })
        assert.strictEqual(tree.type, "root")
        assert(Array.isArray(tree.children))
    })

    test("stringifyMdast converts tree back to markdown", () => {
        const tree = parseMarkdownToMdast("# Hello\n\nWorld")
        const result = stringifyMdast(tree)
        assert(typeof result === "string")
        assert(result.length > 0)
    })

    test("edge cases for HTML comments", () => {
        // Empty comment
        assert(containsHtmlComments("<!---->"))
        assert(!containsHtmlComments(removeHtmlComments("<!---->")))

        // Nested-like content
        const nested = "<!-- outer <!-- inner --> -->"
        assert(containsHtmlComments(nested))
        
        // Comment at start and end
        const wrapped = "<!-- start -->\nContent\n<!-- end -->"
        assert(containsHtmlComments(wrapped))
        const cleanWrapped = removeHtmlComments(wrapped)
        assert(!containsHtmlComments(cleanWrapped))
        assert(cleanWrapped.includes("Content"))
    })

    test("preserves markdown formatting when removing comments", () => {
        const markdownWithFormats = `# Title

- List item 1
- List item 2

<!-- Comment here -->

| Table | Header |
|-------|--------|
| Cell  | Data   |

\`\`\`javascript
console.log("code")
\`\`\`

**Bold** and *italic* text.`

        const result = removeHtmlComments(markdownWithFormats)
        assert(!containsHtmlComments(result))
        assert(result.includes("# Title"))
        assert(result.includes("- List item"))
        assert(result.includes("| Table"))
        assert(result.includes("```javascript"))
        assert(result.includes("**Bold**"))
    })
})