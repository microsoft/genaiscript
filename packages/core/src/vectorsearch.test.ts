import { beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"
import { TestHost } from "./testhost"
import { vectorSearch } from "./vectorsearch"
import { GENAISCRIPT_FOLDER } from "./constants"

describe("vectorsearch", () => {
    const folderPath = `./${GENAISCRIPT_FOLDER}/vectors`
    beforeEach(() => {
        TestHost.install()
    })

    test("onefile", async () => {
        const files = [{ filename: "hello.md", content: "hello world" }]
        const res = await vectorSearch("world", files, { folderPath })
        assert.strictEqual(res.length, 1)
        assert.strictEqual(res[0].filename, "hello.md")
    })

    test("twofiles", async () => {
        const files = [
            { filename: "hello.md", content: "hello world" },
            { filename: "other.md", content: "this is completely unrelated" },
        ]
        const res = await vectorSearch("world", files, {
            folderPath,
            minScore: 0.5,
        })
        assert.strictEqual(res.length, 1)
        assert.strictEqual(res[0].filename, "hello.md")
    })
    test("larger", async () => {
        const files = [
            {
                filename: "markdown.md",
                content: `---
title: What is Markdown? - Understanding Markdown Syntax
description: Learn about Markdown, a lightweight markup language for formatting plain text, its syntax, and how it differs from WYSIWYG editors.
keywords: Markdown, markup language, formatting, plain text, syntax
sidebar: mydoc_sidebar
---
What is Markdown?
 Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages. 

Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

For example, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
`,
            },
            { filename: "other.md", content: "this is completely unrelated" },
        ]
        const res = await vectorSearch("markdown", files, {
            folderPath,
        })
        console.log(res)
        assert.strictEqual(res.length, 1)
        assert.strictEqual(res[0].filename, "markdown.md")
    })
})
