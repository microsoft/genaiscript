import { describe, beforeEach, test } from "node:test"
import assert from "node:assert/strict"
import { createParsers } from "./parsers"
import { MarkdownTrace } from "./trace"
import { XLSXParse } from "./xlsx"
import { readFile } from "fs/promises"
import { resolve } from "path"
import { TestHost } from "./testhost"
import { estimateTokens } from "./tokens"

describe("parsers", async () => {
    let trace: MarkdownTrace
    let model: string
    let parsers: Awaited<ReturnType<typeof createParsers>>

    beforeEach(async () => {
        trace = new MarkdownTrace({})
        model = "test model"
        parsers = await createParsers({ trace, model })
        TestHost.install()
    })

    test("JSON5", () => {
        const result = parsers.JSON5('{"key": "value"}')
        assert.deepStrictEqual(result, { key: "value" })
    })

    test("JSONL", () => {
        const result = parsers.JSONL('{"key": "value"}\n{"key2": "value2"}')
        assert.deepStrictEqual(result[0], { key: "value" })
        assert.deepStrictEqual(result[1], { key2: "value2" })
    })

    test("YAML", () => {
        const result = parsers.YAML("key: value")
        assert.deepStrictEqual(result, { key: "value" })
    })

    test("XML parser", () => {
        const result = parsers.XML("<key>value</key>")
        assert.deepStrictEqual(result, { key: "value" })
    })

    test("TOML", () => {
        const result = parsers.TOML('key = "value"')
        assert.equal(result.key, "value")
    })

    await test("PDF", async () => {
        const result = await parsers.PDF({ filename: "../sample/src/rag/loremipsum.pdf" })
        assert(result.file.content.includes("Lorem"))
    })

    await test("PDF-image", async () => {
        const result = await parsers.PDF(
            { filename: "../sample/src/rag/loremipsum.pdf" },
            { renderAsImage: true }
        )
        console.log(result)
        assert(result.file.content.includes("Lorem"))
    })

    test("CSV", () => {
        const result = parsers.CSV("key,value\n1,2")
        assert.deepStrictEqual(result, [{ key: "1", value: "2" }])
    })

    test("XLSX", async () => {
        const result = await XLSXParse(
            await readFile(resolve("./src/parsers.test.xlsx"))
        )
        assert.deepStrictEqual(result, [
            { name: "Sheet1", rows: [{ key: 1, value: 2 }] },
        ])
    })

    test("frontmatter", () => {
        const result = parsers.frontmatter("---\nkey: value\n---\n")
        assert.deepStrictEqual(result, { key: "value" })
    })

    test("zip", async () => {
        const result = await parsers.unzip(
            {
                filename: "./src/parsers.test.zip",
                content: undefined,
            },
            { glob: "*.md" }
        )
        assert(result.find((f) => f.filename === "markdown.md"))
        assert(!result.find((f) => f.filename === "loremipsum.pdf"))
    })

    test("math", async () => {
        const res = await parsers.math("1 + 3")
        assert.strictEqual(res, 4)
    })

    test("validateJSON", () => {
        const res = parsers.validateJSON(
            {
                type: "object",
                properties: {
                    key: { type: "string" },
                },
                required: ["key"],
            },
            { key: "value" }
        )
        assert.strictEqual(res.pathValid, true)
    })

    // write test about hash
    test("hash", async () => {
        const result = await parsers.hash(
            { test: "test string", arr: [1, 2, "32"], v: new Uint8Array(123) },
            { length: 20 }
        )
        assert.strictEqual(result, "2c34c8d7df7428c89c64") // Example hash value
    })
})
