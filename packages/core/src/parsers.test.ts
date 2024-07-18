import { describe, beforeEach, test } from "node:test"
import assert from "node:assert/strict"
import { createParsers } from "./parsers"
import { MarkdownTrace } from "./trace"
import { XLSXParse } from "./xlsx"
import { readFile } from "fs/promises"
import { resolve } from "path"
import { TestHost } from "./testhost"
import { estimateTokens } from "./tokens"

describe("parsers", () => {
    let trace: MarkdownTrace
    let model: string
    let parsers: ReturnType<typeof createParsers>

    beforeEach(() => {
        trace = new MarkdownTrace({ estimateTokens })
        model = "test model"
        parsers = createParsers({ trace, model })
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

    test("math", () => {
        const res = parsers.math("1 + 3")
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
        assert.strictEqual(res.valid, true)
    })
})
