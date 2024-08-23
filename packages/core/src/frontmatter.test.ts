import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {
    frontmatterTryParse,
    splitMarkdown,
    updateFrontmatter,
} from "./frontmatter"
import { YAMLTryParse } from "./yaml"

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
        assert.deepEqual(YAMLTryParse(frontmatter), { title: "Test" })
        assert.equal(content, "This is a test.")
    })

    test("split markdown with json frontmatter", () => {
        const markdown = `---
{
  "title": "Test"
}
---
This is a test.`
        const { frontmatter, content } = splitMarkdown(markdown)
        assert.deepEqual(JSON.parse(frontmatter), { title: "Test" })
        assert.equal(content, "This is a test.")
    })
})

describe("updateFrontmatter", () => {
    test("update yaml frontmatter", () => {
        const markdown = `---
title: Old Title
foo: bar
---
This is a test.`
        const newFrontmatter: any = { title: "New Title", foo: null }
        const updatedMarkdown = updateFrontmatter(markdown, newFrontmatter)
        const { frontmatter, content } = splitMarkdown(updatedMarkdown)
        assert.deepEqual(YAMLTryParse(frontmatter), { title: "New Title" })
        assert.equal(content, "This is a test.")
    })

    test("update json frontmatter", () => {
        const markdown = `---
{
  "title": "Old Title",
"foo": "bar"
}
---
This is a test.`
        const newFrontmatter: any = { title: "New Title", foo: null }
        const updatedMarkdown = updateFrontmatter(markdown, newFrontmatter, {
            format: "json",
        })
        const { frontmatter, content } = splitMarkdown(updatedMarkdown)
        assert.deepEqual(JSON.parse(frontmatter), { title: "New Title" })
        assert.equal(content, "This is a test.")
    })
})
