import test, { describe } from "node:test"
import assert from "node:assert"
import { chunk, resolveTokenEncoder } from "./encoders"
import { dedent } from "./indent"

describe("resolveTokenEncoder", () => {
    test("gpt-3.5-turbo", async () => {
        const encoder = await resolveTokenEncoder("gpt-3.5-turbo")
        const result = encoder.encode("test line")
        assert.deepEqual(result, [1985, 1584])
    })
    test("gpt-4", async () => {
        const encoder = await resolveTokenEncoder("gpt-4")
        const result = encoder.encode("test line")
        assert.deepEqual(result, [1985, 1584])
    })
    test("gpt-4o", async () => {
        const encoder = await resolveTokenEncoder("gpt-4o")
        const result = encoder.encode("test line")
        assert.deepEqual(result, [3190, 2543])
    })
    test("gpt-4o-mini", async () => {
        const encoder = await resolveTokenEncoder("gpt-4o-mini")
        const result = encoder.encode("test line")
        assert.deepEqual(result, [3190, 2543])
    })
    test("gpt-4o forbidden", async () => {
        const encoder = await resolveTokenEncoder("gpt-4o")
        const result = encoder.encode("<|im_end|>")
        assert.deepEqual(result, [27, 91, 321, 13707, 91, 29])
    })
    test("gpt-4o chunk", async () => {
        const chunks = await chunk(
            {
                filename: "markdown.md",
                content: dedent`---
title: What is Markdown? - Understanding Markdown Syntax
description: Learn about Markdown, a lightweight markup language for formatting plain text, its syntax, and how it differs from WYSIWYG editors.
keywords: Markdown, markup language, formatting, plain text, syntax
sidebar: mydoc_sidebar
---

# Intro

What is Markdown?
 Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages. 

## What?

Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

## Examples

For example, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
`,
            },
            {
                chunkSize: 128,
                chunkOverlap: 16,
                model: "gpt-4o",
                lineNumbers: true,
            }
        )
        console.log(chunks)
        assert.equal(chunks.length, 3)
    })
})
