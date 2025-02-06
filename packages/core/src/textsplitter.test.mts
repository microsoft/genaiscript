import { TextSplitter, TextSplitterConfig, unchunk } from "./textsplitter"
import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { resolveTokenEncoder } from "./encoders"
import { glob } from "glob"
import { readFile } from "fs/promises"

await describe("TextSplitter", async () => {
    const defaultConfig: Partial<TextSplitterConfig> = {
        chunkSize: 10,
        chunkOverlap: 2,
        tokenizer: await resolveTokenEncoder("gpt-4o"),
    }

    test("TextSplitter should split text into chunks based on default separators", () => {
        const textSplitter = new TextSplitter(defaultConfig)
        const text = "This is a test text to split into chunks."
        const chunks = textSplitter.split(text)

        assert(chunks.length > 0)
        const rebuild = chunks.map((c) => c.text).join("")
        assert.equal(rebuild, text)
        chunks.forEach((chunk) => {
            assert(chunk.text)
            assert(chunk.tokens.length <= defaultConfig.chunkSize!)
        })
    })

    test("TextSplitter should split text into chunks with overlap", () => {
        const config: Partial<TextSplitterConfig> = {
            ...defaultConfig,
            chunkSize: 5,
            chunkOverlap: 2,
        }
        const textSplitter = new TextSplitter(config)
        const text = "This is a test text to split into chunks."
        const chunks = textSplitter.split(text)

        assert(chunks.length > 0)
        const rebuild = chunks.map((c) => c.text).join("")
        assert.equal(rebuild, text)
        chunks.forEach((chunk, index) => {
            assert(chunk.text)
            assert(chunk.tokens.length <= config.chunkSize!)
            if (index > 0) {
                assert(chunk.startOverlap.length === config.chunkOverlap)
            }
        })
    })

    test("TextSplitter should throw an error if tokenizer is not provided", () => {
        assert.throws(() => new TextSplitter({} as TextSplitterConfig), {
            message: "Tokenizer is required",
        })
    })

    test("TextSplitter should throw an error if chunkSize is less than 1", () => {
        assert.throws(
            () =>
                new TextSplitter({
                    ...defaultConfig,
                    chunkSize: 0,
                } as TextSplitterConfig),
            {
                message: "chunkSize must be >= 1",
            }
        )
    })

    test("TextSplitter should throw an error if chunkOverlap is less than 0", () => {
        assert.throws(
            () =>
                new TextSplitter({
                    ...defaultConfig,
                    chunkOverlap: -1,
                } as TextSplitterConfig),
            {
                message: "chunkOverlap must be >= 0",
            }
        )
    })

    test("TextSplitter should throw an error if chunkOverlap is greater than chunkSize", () => {
        assert.throws(
            () =>
                new TextSplitter({
                    ...defaultConfig,
                    chunkOverlap: 11,
                } as TextSplitterConfig),
            {
                message: "chunkOverlap must be <= chunkSize",
            }
        )
    })

    test("TextSplitter should use default separators if none are provided", () => {
        const textSplitter = new TextSplitter({
            ...defaultConfig,
            separators: [],
        })
        const text = "This is a test text to split into chunks."
        const chunks = textSplitter.split(text)

        assert(chunks.length > 0)
        console.log(chunks)
        const rebuild = unchunk(text, chunks)
        assert.equal(rebuild, text)
    })

    test("TextSplitter should split text based on provided separators", () => {
        const config: Partial<TextSplitterConfig> = {
            ...defaultConfig,
            separators: [" "],
        }
        const textSplitter = new TextSplitter(config)
        const text = "This is a test text to split into chunks."
        const chunks = textSplitter.split(text)

        assert(chunks.length > 0)
        chunks.forEach((chunk) => {
            assert(chunk.text)
        })
    })

    const docs = await glob("../../docs/src/**/*.mdx?")
    for (const doc of docs) {
        await test(doc, async () => {
            const text = await readFile(doc, { encoding: "utf-8" })
            for (let i = 0; i < 10; i++) {
                const chunkSize = Math.floor(Math.random() * 20) + 10
                const textSplitter = new TextSplitter({
                    ...defaultConfig,
                    docType: "markdown",
                    chunkSize: Math.floor(Math.random() * 20) + 1,
                })
                const chunks = textSplitter.split(text)
                console.log(`chunk: ${chunkSize} -> ${chunks.length}`)
                assert(chunks.length > 0)
                const rebuild = unchunk(text, chunks)
                assert.equal(rebuild, text)
            }
        })
    }
})
