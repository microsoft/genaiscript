import { test } from "node:test"
import { strict as assert } from "node:assert"
import {
    parseMarkdown,
    reconstructMarkdown,
    createTranslationMap,
    extractTranslatableContent,
    type MarkdownChunk,
    type TranslationMap,
    type ParseResult
} from "./mdtranslator"

test("parseMarkdown - basic parsing", async () => {
    const markdown = `# Heading 1

This is a paragraph.

## Heading 2

Another paragraph with **bold** text.

- List item 1
- List item 2

> This is a blockquote`

    const result = await parseMarkdown(markdown)
    
    assert.ok(result.chunks.length > 0, "Should parse chunks")
    assert.ok(result.originalLines.length > 0, "Should preserve original lines")
    
    // Find heading chunks
    const headings = result.chunks.filter(chunk => chunk.type === 'heading')
    assert.equal(headings.length, 2, "Should find 2 headings")
    
    // Find paragraph chunks
    const paragraphs = result.chunks.filter(chunk => chunk.type === 'paragraph')
    assert.ok(paragraphs.length >= 2, "Should find at least 2 paragraphs")
    
    // Check that chunks have required properties
    for (const chunk of result.chunks) {
        assert.ok(chunk.hash, "Chunk should have hash")
        assert.ok(chunk.type, "Chunk should have type")
        assert.ok(chunk.content, "Chunk should have content")
        assert.ok(typeof chunk.startLine === 'number', "Chunk should have startLine")
        assert.ok(typeof chunk.endLine === 'number', "Chunk should have endLine")
        assert.ok(typeof chunk.translatable === 'boolean', "Chunk should have translatable flag")
    }
})

test("parseMarkdown - code block handling", async () => {
    const markdown = `# Title

Regular text.

\`\`\`javascript
console.log("Hello");
\`\`\`

More text.`

    // Test with includeCodeBlocks = false (default)
    const result1 = await parseMarkdown(markdown)
    const codeChunks1 = result1.chunks.filter(chunk => chunk.type === 'code')
    const translatableCodeChunks1 = codeChunks1.filter(chunk => chunk.translatable)
    assert.equal(translatableCodeChunks1.length, 0, "Code blocks should not be translatable by default")
    
    // Test with includeCodeBlocks = true
    const result2 = await parseMarkdown(markdown, { includeCodeBlocks: true })
    const codeChunks2 = result2.chunks.filter(chunk => chunk.type === 'code')
    const translatableCodeChunks2 = codeChunks2.filter(chunk => chunk.translatable)
    assert.ok(translatableCodeChunks2.length > 0, "Code blocks should be translatable when enabled")
})

test("parseMarkdown - HTML block handling", async () => {
    const markdown = `# Title

Regular text.

<div>
HTML content
</div>

More text.`

    // Test with includeHtmlBlocks = false (default)
    const result1 = await parseMarkdown(markdown)
    const htmlChunks1 = result1.chunks.filter(chunk => chunk.type === 'html')
    const translatableHtmlChunks1 = htmlChunks1.filter(chunk => chunk.translatable)
    assert.equal(translatableHtmlChunks1.length, 0, "HTML blocks should not be translatable by default")
    
    // Test with includeHtmlBlocks = true
    const result2 = await parseMarkdown(markdown, { includeHtmlBlocks: true })
    const htmlChunks2 = result2.chunks.filter(chunk => chunk.type === 'html')
    const translatableHtmlChunks2 = htmlChunks2.filter(chunk => chunk.translatable)
    assert.ok(translatableHtmlChunks2.length > 0, "HTML blocks should be translatable when enabled")
})

test("parseMarkdown - heading levels", async () => {
    const markdown = `# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6`

    const result = await parseMarkdown(markdown)
    const headings = result.chunks.filter(chunk => chunk.type === 'heading')
    
    assert.equal(headings.length, 6, "Should find 6 headings")
    
    for (let i = 0; i < headings.length; i++) {
        assert.equal(headings[i].level, i + 1, `Heading ${i + 1} should have correct level`)
    }
})

test("parseMarkdown - hash consistency", async () => {
    const markdown = `# Same Content

This is identical content.

# Different Content

This is different content.`

    const result1 = await parseMarkdown(markdown)
    const result2 = await parseMarkdown(markdown)
    
    // Hashes should be consistent across runs
    assert.equal(result1.chunks.length, result2.chunks.length, "Chunk count should be same")
    
    for (let i = 0; i < result1.chunks.length; i++) {
        assert.equal(result1.chunks[i].hash, result2.chunks[i].hash, "Hashes should be identical")
    }
})

test("createTranslationMap", () => {
    const chunks: MarkdownChunk[] = [
        {
            hash: "hash1",
            type: "heading",
            content: "# English Title",
            startLine: 0,
            endLine: 0,
            translatable: true,
            level: 1
        },
        {
            hash: "hash2", 
            type: "paragraph",
            content: "English paragraph.",
            startLine: 2,
            endLine: 2,
            translatable: true
        },
        {
            hash: "hash3",
            type: "code",
            content: "console.log('hello')",
            startLine: 4,
            endLine: 4,
            translatable: false
        }
    ]
    
    const translations = ["# Título en Español", "Párrafo en español."]
    const map = createTranslationMap(chunks, translations)
    
    assert.equal(map["hash1"], "# Título en Español", "Should map first translatable chunk")
    assert.equal(map["hash2"], "Párrafo en español.", "Should map second translatable chunk")
    assert.equal(map["hash3"], undefined, "Should not map non-translatable chunk")
})

test("extractTranslatableContent", () => {
    const chunks: MarkdownChunk[] = [
        {
            hash: "hash1",
            type: "heading",
            content: "# Title",
            startLine: 0,
            endLine: 0,
            translatable: true,
            level: 1
        },
        {
            hash: "hash2",
            type: "paragraph", 
            content: "Paragraph text.",
            startLine: 2,
            endLine: 2,
            translatable: true
        },
        {
            hash: "hash3",
            type: "code",
            content: "console.log('test')",
            startLine: 4,
            endLine: 4,
            translatable: false
        }
    ]
    
    const content = extractTranslatableContent(chunks)
    
    assert.equal(content.length, 2, "Should extract only translatable content")
    assert.equal(content[0], "# Title", "Should extract first translatable chunk")
    assert.equal(content[1], "Paragraph text.", "Should extract second translatable chunk")
})

test("reconstructMarkdown - with translations", () => {
    const originalMarkdown = `# English Title

This is an English paragraph.

\`\`\`javascript
console.log("hello");
\`\`\`

Another paragraph.`

    const parseResult: ParseResult = {
        chunks: [
            {
                hash: "hash1",
                type: "heading",
                content: "# English Title",
                startLine: 0,
                endLine: 0,
                translatable: true,
                level: 1
            },
            {
                hash: "hash2",
                type: "paragraph",
                content: "This is an English paragraph.",
                startLine: 2,
                endLine: 2,
                translatable: true
            },
            {
                hash: "hash3",
                type: "code",
                content: "```javascript\nconsole.log(\"hello\");\n```",
                startLine: 4,
                endLine: 6,
                translatable: false
            },
            {
                hash: "hash4",
                type: "paragraph",
                content: "Another paragraph.",
                startLine: 8,
                endLine: 8,
                translatable: true
            }
        ],
        originalLines: originalMarkdown.split('\n')
    }
    
    const translationMap: TranslationMap = {
        "hash1": "# Título en Español",
        "hash2": "Este es un párrafo en español.",
        "hash4": "Otro párrafo."
    }
    
    const result = reconstructMarkdown(parseResult, translationMap)
    
    assert.ok(result.includes("# Título en Español"), "Should include translated heading")
    assert.ok(result.includes("Este es un párrafo en español."), "Should include translated paragraph")
    assert.ok(result.includes("Otro párrafo."), "Should include translated second paragraph")
    assert.ok(result.includes("console.log(\"hello\");"), "Should preserve code block")
})

test("reconstructMarkdown - fallback to original", () => {
    const originalMarkdown = `# Title

Original paragraph.`

    const parseResult: ParseResult = {
        chunks: [
            {
                hash: "hash1",
                type: "heading", 
                content: "# Title",
                startLine: 0,
                endLine: 0,
                translatable: true,
                level: 1
            },
            {
                hash: "hash2",
                type: "paragraph",
                content: "Original paragraph.",
                startLine: 2, 
                endLine: 2,
                translatable: true
            }
        ],
        originalLines: originalMarkdown.split('\n')
    }
    
    // Empty translation map - should fallback to original
    const translationMap: TranslationMap = {}
    
    const result = reconstructMarkdown(parseResult, translationMap)
    
    assert.equal(result.trim(), originalMarkdown.trim(), "Should fallback to original content")
})

test("parseMarkdown - WorkspaceFile input", async () => {
    const workspaceFile = {
        filename: "test.md",
        content: "# Test\n\nContent here.",
        encoding: undefined
    }
    
    const result = await parseMarkdown(workspaceFile)
    
    assert.ok(result.chunks.length > 0, "Should parse WorkspaceFile content")
    
    const headings = result.chunks.filter(chunk => chunk.type === 'heading')
    assert.equal(headings.length, 1, "Should find heading")
    assert.ok(headings[0].content.includes("Test"), "Should parse heading content")
})

test("parseMarkdown - base64 encoding error", async () => {
    const workspaceFile = {
        filename: "test.md",
        content: "base64content",
        encoding: "base64" as const
    }
    
    await assert.rejects(
        () => parseMarkdown(workspaceFile),
        /base64 encoding not supported/,
        "Should reject base64 encoded files"
    )
})