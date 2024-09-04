import { promptyParse } from "./prompty"
import { describe, test, beforeEach } from "node:test"
import assert from "node:assert/strict"

describe("promptyParse", () => {
    test("correctly parses an empty markdown string", () => {
        const result = promptyParse("")
        assert.deepStrictEqual(result, {
            frontmatter: {},
            content: "",
            messages: [],
        })
    })

    test("correctly parses a markdown string without frontmatter", () => {
        const content = "This is a sample content without frontmatter."
        const result = promptyParse(content)
        assert.deepStrictEqual(result, {
            frontmatter: {},
            content: content,
            messages: [{ role: "system", content: content }],
        })
    })

    test("correctly parses a markdown string with valid frontmatter", () => {
        const markdownString = `---
name: Test
description: A test description
version: 1.0.0
authors:
  - Author1
  - Author2
tags:
  - tag1
  - tag2
sample:
  key: value
---
# Heading
Content below heading.`
        const result = promptyParse(markdownString)
        assert.deepStrictEqual(result.frontmatter, {
            name: "Test",
            description: "A test description",
            version: "1.0.0",
            authors: ["Author1", "Author2"],
            tags: ["tag1", "tag2"],
            sample: { key: "value" },
        })
        assert.strictEqual(result.content, "# Heading\nContent below heading.")
    })

    test("correctly parses a markdown string with content split into roles", () => {
        const markdownContent = `user:
User's message
assistant:
Assistant's reply
user:
Another message from the user`
        const result = promptyParse(markdownContent)
        assert.deepStrictEqual(result.messages, [
            { role: "user", content: "User's message" },
            { role: "assistant", content: "Assistant's reply" },
            { role: "user", content: "Another message from the user" },
        ])
    })

    test("correctly handles a markdown string with content but without roles", () => {
        const markdownContent = `Just some content without specifying roles.`
        const result = promptyParse(markdownContent)
        assert.deepStrictEqual(result.messages, [
            { role: "system", content: markdownContent },
        ])
    })
})
