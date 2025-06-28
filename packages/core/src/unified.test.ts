import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {
    parseMarkdownToMdast,
    processMarkdownWithMdast,
    stringifyMdast,
    containsHtmlComments,
    removeHtmlComments,
    type MdastRoot,
} from "./unified"

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
        const result = processMarkdownWithMdast(markdownWithoutComments)
        // The output should be similar to the input (allowing for formatting differences)
        assert(result.includes("# Hello World"))
        assert(result.includes("## Section 2"))
        assert(result.includes("**bold**"))
    })

    test("processMarkdownWithMdast removes comments when ignoreHtmlComments is true", () => {
        const result = processMarkdownWithMdast(markdownWithComments, {
            ignoreHtmlComments: true,
        })
        
        // Comments should be removed
        assert(!result.includes("<!-- This is an HTML comment -->"))
        assert(!result.includes("<!-- Another comment with"))
        
        // Regular content should be preserved
        assert(result.includes("# Hello World"))
        assert(result.includes("## Section 2"))
        assert(result.includes("**bold**"))
    })

    test("processMarkdownWithMdast preserves comments when ignoreHtmlComments is false", () => {
        const result = processMarkdownWithMdast(markdownWithComments, {
            ignoreHtmlComments: false,
        })
        
        // Comments should be preserved
        assert(result.includes("<!-- This is an HTML comment -->"))
        
        // Regular content should also be preserved
        assert(result.includes("# Hello World"))
        assert(result.includes("## Section 2"))
    })

    test("removeHtmlComments convenience function works", () => {
        const result = removeHtmlComments(markdownWithComments)
        
        // Comments should be removed
        assert(!result.includes("<!-- This is an HTML comment -->"))
        assert(!result.includes("<!-- Another comment with"))
        
        // Regular content should be preserved
        assert(result.includes("# Hello World"))
        assert(result.includes("**bold**"))
    })

    test("stringifyMdast converts tree back to markdown", () => {
        const tree = parseMarkdownToMdast("# Test\n\nParagraph")
        const result = stringifyMdast(tree)
        
        assert(result.includes("# Test"))
        assert(result.includes("Paragraph"))
    })

    test("roundtrip processing preserves content", () => {
        const original = "# Title\n\nSome content with **emphasis**."
        const tree = parseMarkdownToMdast(original)
        const result = stringifyMdast(tree)
        
        // Should contain the essential content (allowing for formatting differences)
        assert(result.includes("# Title"))
        assert(result.includes("**emphasis**"))
    })
})