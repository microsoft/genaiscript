import {
    isJSONObjectOrArray,
    JSONrepair,
    JSON5parse,
    JSON5TryParse,
} from "./json5"
import { describe, test } from "node:test"
import assert from "node:assert/strict"

describe("json5.ts", () => {
    test("isJSONObjectOrArray should identify JSON objects or arrays", () => {
        assert.strictEqual(isJSONObjectOrArray('{ "key": "value" }'), true)
        assert.strictEqual(isJSONObjectOrArray("[1, 2, 3]"), true)
        assert.strictEqual(isJSONObjectOrArray(' { "key": "value" }'), true)
        assert.strictEqual(isJSONObjectOrArray("non-json-content"), false)
    })

    test("JSONrepair should repair broken JSON strings", () => {
        const brokenJSON = '{"key": "value",}'
        const repaired = JSONrepair(brokenJSON)
        assert.strictEqual(repaired, '{"key": "value"}')
    })

    test("JSON5parse should parse valid JSON5 strings", () => {
        const json5 = '{ key: "value" }'
        const parsed = JSON5parse(json5)
        assert.deepStrictEqual(parsed, { key: "value" })
    })

    test("JSON5parse with repair option should repair and parse invalid JSON5 strings", () => {
        const brokenJSON5 = '{ key: "value", }'
        const parsed = JSON5parse(brokenJSON5, { repair: true })
        assert.deepStrictEqual(parsed, { key: "value" })
    })

    test("JSON5parse with errorAsDefaultValue should return default value on error", () => {
        const brokenJSON5 = '{ key: "value }'
        const defaultValue = { key: "default" }
        const parsed = JSON5parse(brokenJSON5, {
            errorAsDefaultValue: true,
            defaultValue,
        })
        assert.deepStrictEqual(parsed, defaultValue)
    })

    test("JSON5parse should throw error on invalid JSON5 without options", () => {
        const brokenJSON5 = '{ key: "value }'
        assert.throws(() => {
            JSON5parse(brokenJSON5)
        })
    })

    test("JSON5TryParse should handle undefined and null values", () => {
        assert.strictEqual(JSON5TryParse(undefined), undefined)
        assert.strictEqual(JSON5TryParse(null), null)
    })

    test("JSON5TryParse should parse valid JSON5 strings", () => {
        const json5 = '{ key: "value" }'
        const parsed = JSON5TryParse(json5)
        assert.deepStrictEqual(parsed, { key: "value" })
    })

    test("JSON5TryParse should repair strings", () => {
        const brokenJSON5 = '{ key: "value'
        const parsed = JSON5TryParse(brokenJSON5)
        assert.deepStrictEqual(parsed, { key: "value" })
    })
})
