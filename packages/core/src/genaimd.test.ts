import { genaiMdParse, genaiMdToGenAIScript } from "./genaimd"
import { describe, test } from "node:test"
import assert from "node:assert/strict"

describe("genaiMdParse", () => {
    test("correctly parses an empty markdown string", () => {
        const result = genaiMdParse(undefined, "")
        assert.deepStrictEqual(result, {
            meta: {},
            frontmatter: undefined,
            segments: [],
        })
    })

    test("correctly parses a markdown string without frontmatter", () => {
        const content = "This is a sample content without frontmatter."
        const result = genaiMdParse(undefined, content)
        assert.deepStrictEqual(result, {
            meta: {},
            frontmatter: undefined,
            segments: [{ type: 'text', content: content }],
        })
    })

    test("correctly parses a markdown string with valid frontmatter", () => {
        const markdownString = `---
title: Test Script
description: A test description
model: gpt-4
temperature: 0.5
parameters:
  input: string
---
# Heading
Content below heading.`
        const result = genaiMdParse(undefined, markdownString)
        assert.deepStrictEqual(result.frontmatter, {
            title: "Test Script",
            description: "A test description",
            model: "gpt-4",
            temperature: 0.5,
            parameters: {
                input: "string"
            }
        })
        assert.deepStrictEqual(result.segments, [
            { type: 'text', content: "# Heading\nContent below heading." }
        ])
        assert.deepStrictEqual(result.meta, {
            title: "Test Script",
            description: "A test description", 
            model: "gpt-4",
            temperature: 0.5,
            parameters: {
                input: "string"
            }
        })
    })

    test("correctly parses content with interleaved text and code blocks", () => {
        const markdownContent = `# Test Script

Some intro text.

\`\`\`ts genai
const name = "world"
$\`Hello \${name}!\`
\`\`\`

More content here.

\`\`\`typescript genai
env.vars.count = 5
\`\`\`

Final content.`
        const result = genaiMdParse(undefined, markdownContent)
        assert.deepStrictEqual(result.segments, [
            { type: 'text', content: '# Test Script\n\nSome intro text.' },
            { type: 'code', content: 'const name = "world"\n$`Hello ${name}!`' },
            { type: 'text', content: 'More content here.' },
            { type: 'code', content: 'env.vars.count = 5' },
            { type: 'text', content: 'Final content.' }
        ])
    })

    test("ignores non-genai code blocks", () => {
        const markdownContent = `# Test Script

Some intro text.

\`\`\`ts
const regular = "code"
\`\`\`

\`\`\`ts genai
const genai = "code"
\`\`\`

\`\`\`javascript
const another = "regular"
\`\`\`

Final content.`
        const result = genaiMdParse(undefined, markdownContent)
        assert.deepStrictEqual(result.segments, [
            { type: 'text', content: `# Test Script

Some intro text.

\`\`\`ts
const regular = "code"
\`\`\`` },
            { type: 'code', content: 'const genai = "code"' },
            { type: 'text', content: `\`\`\`javascript
const another = "regular"
\`\`\`

Final content.` }
        ])
    })
})

describe("genaiMdToGenAIScript", () => {
    test("generates script with metadata", () => {
        const doc = {
            meta: {
                title: "Test Script",
                description: "A test description",
                model: "gpt-4"
            },
            frontmatter: {},
            segments: [
                { type: 'text' as const, content: 'Hello world!' }
            ]
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('script({'))
        assert.ok(result.includes('"title": "Test Script"'))
        assert.ok(result.includes('"model": "gpt-4"'))
        assert.ok(result.includes('$`Hello world!`'))
    })

    test("generates script with interleaved code and text", () => {
        const doc = {
            meta: {},
            frontmatter: {},
            segments: [
                { type: 'text' as const, content: 'First text section' },
                { type: 'code' as const, content: 'const name = "test"' },
                { type: 'text' as const, content: 'Second text section' },
                { type: 'code' as const, content: '$`Hello ${name}!`' }
            ]
        }
        const result = genaiMdToGenAIScript(doc)
        
        // Check order and structure
        const lines = result.split('\n').filter(line => line.trim())
        assert.ok(result.includes('$`First text section`'))
        assert.ok(result.includes('const name = "test"'))
        assert.ok(result.includes('$`Second text section`'))
        assert.ok(result.includes('$`Hello ${name}!`'))
        
        // Verify interleaving - text should come before code in output
        const firstTextIndex = result.indexOf('$`First text section`')
        const firstCodeIndex = result.indexOf('const name = "test"')
        const secondTextIndex = result.indexOf('$`Second text section`')
        const secondCodeIndex = result.indexOf('$`Hello ${name}!`')
        
        assert.ok(firstTextIndex < firstCodeIndex)
        assert.ok(firstCodeIndex < secondTextIndex)
        assert.ok(secondTextIndex < secondCodeIndex)
    })

    test("handles empty content", () => {
        const doc = {
            meta: { title: "Test" },
            frontmatter: {},
            segments: []
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('script({'))
        assert.ok(result.includes('"title": "Test"'))
        assert.ok(!result.includes('$`'))
    })

    test("escapes backticks in content", () => {
        const doc = {
            meta: {},
            frontmatter: {},
            segments: [
                { type: 'text' as const, content: "Use `backticks` in your code." }
            ]
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('$`Use \\`backticks\\` in your code.`'))
    })

    test("handles only code blocks", () => {
        const doc = {
            meta: {},
            frontmatter: {},
            segments: [
                { type: 'code' as const, content: 'const hello = "world"' },
                { type: 'code' as const, content: 'console.log(hello)' }
            ]
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('const hello = "world"'))
        assert.ok(result.includes('console.log(hello)'))
        assert.ok(!result.includes('$`'))
    })

    test("handles only text content", () => {
        const doc = {
            meta: {},
            frontmatter: {},
            segments: [
                { type: 'text' as const, content: 'Only text here' }
            ]
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('$`Only text here`'))
        assert.ok(!result.includes('const'))
    })
}))