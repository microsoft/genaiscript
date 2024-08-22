import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { frontmatterTryParse, splitMarkdown, updateFrontmatter } from "./frontmatter"

describe("replace frontmatter", () => {
    test("only", () => {
        const actual = `---
foo: bar
---
`
        const { value: res } = frontmatterTryParse(actual)
        assert.deepEqual(res, { foo: "bar" })
    })
    test("mix", () => {
        const actual = `---
foo: bar
---
foo bar
`
        const { value: res } = frontmatterTryParse(actual)
        assert.deepEqual(res, { foo: "bar" })
    })
})

describe("splitMarkdown", () => {
    test("split markdown with yaml frontmatter", () => {
        const markdown = `---
title: Test
---
This is a test.`
        const { frontmatter, content } = splitMarkdown(markdown)
        assert.deepEqual(frontmatter, { title: "Test" })
        assert.equal(content, "This is a test.")
    })

    test("split markdown with json frontmatter", () => {
        const markdown = `---
{
  "title": "Test"
}
---
This is a test.`
        const { frontmatter, content } = splitMarkdown(markdown, { format: "json" })
        assert.deepEqual(frontmatter, { title: "Test" })
        assert.equal(content, "This is a test.")
    })
})

describe("updateFrontmatter", () => {
    test("update yaml frontmatter", () => {
        const markdown = `---
title: Old Title
---
This is a test.`
        const newFrontmatter = { title: "New Title" }
        const updatedMarkdown = updateFrontmatter(markdown, newFrontmatter)
        const { frontmatter, content } = splitMarkdown(updatedMarkdown)
        assert.deepEqual(frontmatter, { title: "New Title" })
        assert.equal(content, "This is a test.")
    })

    test("update json frontmatter", () => {
        const markdown = `---
{
  "title": "Old Title"
}
---
This is a test.`
        const newFrontmatter = { title: "New Title" }
        const updatedMarkdown = updateFrontmatter(markdown, newFrontmatter, { format: "json" })
        const { frontmatter, content } = splitMarkdown(updatedMarkdown, { format: "json" })
        assert.deepEqual(frontmatter, { title: "New Title" })
        assert.equal(content, "This is a test.")
    })
})
