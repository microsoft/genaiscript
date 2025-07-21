import { genaiMdParse, genaiMdToGenAIScript } from "./genaimd"
import { describe, test } from "node:test"
import assert from "node:assert/strict"

describe("genaiMdParse", () => {
    test("correctly parses an empty markdown string", () => {
        const result = genaiMdParse(undefined, "")
        assert.deepStrictEqual(result, {
            meta: {},
            frontmatter: undefined,
            content: "",
            codeBlocks: [],
        })
    })

    test("correctly parses a markdown string without frontmatter", () => {
        const content = "This is a sample content without frontmatter."
        const result = genaiMdParse(undefined, content)
        assert.deepStrictEqual(result, {
            meta: {},
            frontmatter: undefined,
            content: content,
            codeBlocks: [],
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
        assert.strictEqual(result.content, "# Heading\nContent below heading.")
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

    test("correctly extracts genai code blocks", () => {
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
        assert.deepStrictEqual(result.codeBlocks, [
            'const name = "world"\n$`Hello ${name}!`',
            'env.vars.count = 5'
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
        assert.deepStrictEqual(result.codeBlocks, [
            'const genai = "code"'
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
            content: "Hello world!",
            codeBlocks: []
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('script({'))
        assert.ok(result.includes('"title": "Test Script"'))
        assert.ok(result.includes('"model": "gpt-4"'))
        assert.ok(result.includes('$`Hello world!`'))
    })

    test("generates script with code blocks", () => {
        const doc = {
            meta: {},
            frontmatter: {},
            content: "Hello world!",
            codeBlocks: [
                'const name = "test"',
                '$`Hello ${name}!`'
            ]
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('const name = "test"'))
        assert.ok(result.includes('$`Hello ${name}!`'))
        assert.ok(result.includes('$`Hello world!`'))
    })

    test("removes genai code blocks from content", () => {
        const doc = {
            meta: {},
            frontmatter: {},
            content: `Some text

\`\`\`ts genai
const code = "block"
\`\`\`

More text here.`,
            codeBlocks: ['const code = "block"']
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('const code = "block"'))
        assert.ok(result.includes('$`Some text'))
        assert.ok(result.includes('More text here.`'))
        assert.ok(!result.includes('```ts genai'))
    })

    test("handles empty content", () => {
        const doc = {
            meta: { title: "Test" },
            frontmatter: {},
            content: "",
            codeBlocks: []
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
            content: "Use `backticks` in your code.",
            codeBlocks: []
        }
        const result = genaiMdToGenAIScript(doc)
        assert.ok(result.includes('$`Use \\`backticks\\` in your code.`'))
    })
})