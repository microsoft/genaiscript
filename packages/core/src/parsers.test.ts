import { describe, beforeEach, test } from "node:test"
import assert from "node:assert/strict"
import { createParsers } from "./parsers"
import { MarkdownTrace } from "./trace"

describe("parsers", () => {
    let trace: MarkdownTrace
    let model: string
    let parsers: ReturnType<typeof createParsers>

    beforeEach(() => {
        trace = new MarkdownTrace()
        model = "test model"
        parsers = createParsers({ trace, model })
    })

    test("JSON5", () => {
        const result = parsers.JSON5('{"key": "value"}')
        assert.deepStrictEqual(result, { key: "value" })
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

    test("XSLX", () => {
        const result = parsers.XSLX(file)
    })

    test("frontmatter", () => {
        const result = parsers.frontmatter("---\nkey: value\n---\n")
        assert.deepStrictEqual(result, { key: "value" })
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
