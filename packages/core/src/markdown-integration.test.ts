import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {
    prettifyMarkdownWithCommentHandling,
    analyzeMarkdownContent,
    cleanMarkdownForAI,
} from "./markdown-integration"

describe("markdown integration with unified", () => {
    const markdownWithComments = `# Hello World

This is a paragraph.

<!-- This is an HTML comment that should be removed -->

## Section 2

Another paragraph with some content.

<!-- 
Multi-line comment
that spans several lines
and should also be removed
-->

Some **bold** text and *italic* text.

### Subsection

More content here.

<!-- Another comment -->`

    const markdownWithoutComments = `# Hello World

This is a paragraph.

## Section 2

Another paragraph with some content.

Some **bold** text and *italic* text.

### Subsection

More content here.`

    test("prettifyMarkdownWithCommentHandling preserves comments by default", () => {
        const result = prettifyMarkdownWithCommentHandling(markdownWithComments)
        
        // Should contain the comments
        assert(result.indexOf("<!-- This is an HTML comment") !== -1)
        assert(result.indexOf("<!-- Another comment -->") !== -1)
        
        // Should also contain the content
        assert(result.indexOf("# Hello World") !== -1)
        assert(result.indexOf("**bold**") !== -1)
    })

    test("prettifyMarkdownWithCommentHandling removes comments when requested", () => {
        const result = prettifyMarkdownWithCommentHandling(markdownWithComments, {
            ignoreHtmlComments: true
        })
        
        // Should not contain the comments
        assert(result.indexOf("<!-- This is an HTML comment") === -1)
        assert(result.indexOf("<!-- Another comment -->") === -1)
        assert(result.indexOf("<!--") === -1)
        
        // Should still contain the content
        assert(result.indexOf("# Hello World") !== -1)
        assert(result.indexOf("**bold**") !== -1)
        assert(result.indexOf("## Section 2") !== -1)
    })

    test("analyzeMarkdownContent provides correct analysis", () => {
        const analysis1 = analyzeMarkdownContent(markdownWithComments)
        assert.strictEqual(analysis1.hasHtmlComments, true)
        assert(analysis1.commentLines > 0)
        assert(analysis1.suggestions.removeComments !== null)
        assert(analysis1.suggestions.processing.indexOf("HTML comments detected") !== -1)

        const analysis2 = analyzeMarkdownContent(markdownWithoutComments)
        assert.strictEqual(analysis2.hasHtmlComments, false)
        assert.strictEqual(analysis2.commentLines, 0)
        assert.strictEqual(analysis2.suggestions.removeComments, null)
        assert(analysis2.suggestions.processing.indexOf("No HTML comments found") !== -1)
    })

    test("cleanMarkdownForAI removes comments and prettifies", () => {
        const result = cleanMarkdownForAI(markdownWithComments)
        
        // Should not contain any HTML comments
        assert(result.indexOf("<!--") === -1)
        
        // Should contain the main content
        assert(result.indexOf("# Hello World") !== -1)
        assert(result.indexOf("**bold**") !== -1)
        assert(result.indexOf("## Section 2") !== -1)
        assert(result.indexOf("### Subsection") !== -1)
        
        // Should be shorter than the original (comments removed)
        assert(result.length < markdownWithComments.length)
    })

    test("cleanMarkdownForAI handles markdown without comments", () => {
        const result = cleanMarkdownForAI(markdownWithoutComments)
        
        // Should contain all the content
        assert(result.indexOf("# Hello World") !== -1)
        assert(result.indexOf("**bold**") !== -1)
        
        // Length should be similar (only prettification applied)
        assert(Math.abs(result.length - markdownWithoutComments.length) < 100)
    })

    test("integration maintains markdown structure", () => {
        const testMd = `# Title

Paragraph 1.

<!-- Comment to remove -->

## Subtitle

Paragraph 2 with **emphasis**.

<!-- Another comment -->

- List item 1
- List item 2

### Sub-subtitle

Final paragraph.`

        const cleaned = cleanMarkdownForAI(testMd)
        
        // Should preserve structural elements
        assert(cleaned.indexOf("# Title") !== -1)
        assert(cleaned.indexOf("## Subtitle") !== -1)
        assert(cleaned.indexOf("### Sub-subtitle") !== -1)
        assert(cleaned.indexOf("**emphasis**") !== -1)
        assert(cleaned.indexOf("- List item 1") !== -1)
        assert(cleaned.indexOf("- List item 2") !== -1)
        
        // Should remove comments
        assert(cleaned.indexOf("<!--") === -1)
    })
})