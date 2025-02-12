import { chunkMarkdown } from "./mdchunk"
import { beforeEach, describe, test } from "node:test"
import assert from "node:assert"
import { glob } from "glob"
import { readFile } from "node:fs/promises"
import { DOCXTryParse } from "./docx"
import { TestHost } from "./testhost"

describe(`chunkMarkdown`, async () => {
    const estimateTokens = (text: string) => text.split(/\s+/).length
    beforeEach(() => {
        TestHost.install()
    })

    test(`handles empty markdown string`, async () => {
        const markdown = ``
        const result = await chunkMarkdown(markdown, estimateTokens)
        assert.strictEqual(result.map((r) => r.content).join("\n"), markdown)

        assert.deepStrictEqual(result, [])
    })

    test(`chunks markdown with single heading`, async () => {
        const markdown = `# Heading 1
Content under heading 1`
        const result = await chunkMarkdown(markdown, estimateTokens, 10)
        assert.strictEqual(result.map((r) => r.content).join("\n"), markdown)

        assert.deepStrictEqual(
            result.map((r) => r.content),
            [`# Heading 1\nContent under heading 1`]
        )
    })

    test(`chunks markdown with multiple headings`, async () => {
        const markdown = `# Heading 1
Content under heading 1
Content under heading 1.1
Content under heading 1.2
## Heading 2
Content under heading 2`
        const result = await chunkMarkdown(markdown, estimateTokens, 10)
        assert.strictEqual(result.map((r) => r.content).join("\n"), markdown)

        assert.deepStrictEqual(
            result.map((r) => r.content),
            [
                `# Heading 1
Content under heading 1
Content under heading 1.1
Content under heading 1.2`,
                `## Heading 2
Content under heading 2`,
            ]
        )
    })

    test(`chunks markdown with nested headings`, async () => {
        const markdown = `# Heading 1
Content under heading 1 abracadabra
## Heading 2
Content under heading 2 abracadabra
### Heading 3
Content under heading 3 abracadabra`
        const result = await chunkMarkdown(markdown, estimateTokens, 5)
        assert.strictEqual(result.map((r) => r.content).join("\n"), markdown)

        assert.deepStrictEqual(
            result.map((r) => r.content),
            [
                `# Heading 1
Content under heading 1 abracadabra`,
                `## Heading 2
Content under heading 2 abracadabra`,
                `### Heading 3
Content under heading 3 abracadabra`,
            ]
        )
    })

    test(`chunks markdown with large content`, async () => {
        const markdown =
            `# Heading 1\n` +
            `Content `.repeat(100) +
            `\n## Heading 2\n` +
            `Content `.repeat(100)
        const result = await chunkMarkdown(markdown, estimateTokens, 50)
        assert.strictEqual(result.map((r) => r.content).join("\n"), markdown)

        assert(result.length > 1)
    })

    test(`chunks markdown with backtracking`, async () => {
        const markdown = `# Heading 1
Content under heading 1
## Heading 2
Content under heading 2
### Heading 3
Content under heading 3`
        const result = await chunkMarkdown(markdown, estimateTokens, 5)
        assert.strictEqual(result.map((r) => r.content).join("\n"), markdown)

        assert.deepStrictEqual(
            result.map((r) => r.content),
            [
                `# Heading 1\nContent under heading 1`,
                `## Heading 2\nContent under heading 2`,
                `### Heading 3\nContent under heading 3`,
            ]
        )
    })

    test(`chunks markdown with large sections`, async () => {
        const markdown = `
# markdown
What is Markdown?

## What is Markdown?
Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.

## Using Markdown is different than using a WYSIWYG editor
Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

## characteristics of Markdown
For ixample, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....

## Lorem ipsum

### What is Lorem Ipsum?

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

### Why do we use it?

It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).

### Where does it come from?

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

### Where can I get some?

There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words.
        `
        for (let i = 0; i < 70; ++i) {
            const maxTokens = i * 10
            const result = await chunkMarkdown(
                markdown,
                estimateTokens,
                maxTokens
            )
            console.log(`${maxTokens} => ${result.length}`)
            assert.strictEqual(
                result.map((r) => r.content).join("\n"),
                markdown
            )
        }
    })

    const docs = await glob("../../docs/src/content/**/*.md*")
    for (const doc of docs) {
        await test(`docs: chunks markdown from ${doc}`, async () => {
            const markdown = await readFile(doc, { encoding: "utf-8" })
            assert(markdown)
            for (let i = 0; i < 12; ++i) {
                const maxTokens = 1 << i
                const result = await chunkMarkdown(
                    markdown,
                    estimateTokens,
                    maxTokens
                )
                // console.log(`${maxTokens} => ${result.length}`)
                assert.strictEqual(
                    result.map((r) => r.content).join("\n"),
                    markdown
                )
            }
        })
    }

    await test(`word: chunks markdown from docx`, async () => {
        const markdown = await DOCXTryParse(
            "../../packages/sample/src/rag/Document.docx",
            {
                format: "markdown",
            }
        )
        assert(markdown)
        for (let i = 0; i < 12; ++i) {
            const result = await chunkMarkdown(markdown, estimateTokens, 1 << i)
            assert.strictEqual(
                result.map((r) => r.content).join("\n"),
                markdown
            )
        }
    })
})
