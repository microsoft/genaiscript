import { describe, test } from "node:test"
import assert from "node:assert"

import {
    promptParameterTypeToJSONSchema,
    promptParametersSchemaToJSONSchema,
} from "./parameters"
import { parametersToVars, proxifyEnvVars } from "./vars"

describe("promptParameterTypeToJSONSchema", () => {
    test("string type", () => {
        const result = promptParameterTypeToJSONSchema("test")
        assert.deepStrictEqual(result, { type: "string", default: "test" })
    })
    test("schema string type", () => {
        const result = promptParameterTypeToJSONSchema({
            type: "string",
            default: "test",
        })
        assert.deepStrictEqual(result, { type: "string", default: "test" })
    })

    test("schema string type", () => {
        const result = promptParameterTypeToJSONSchema({
            type: "string",
            required: true,
        })
        assert.deepStrictEqual(result, { type: "string" })
    })

    test("number type", () => {
        const result = promptParameterTypeToJSONSchema(42)
        assert.deepStrictEqual(result, { type: "integer", default: 42 })
    })

    test("boolean type", () => {
        const result = promptParameterTypeToJSONSchema(true)
        assert.deepStrictEqual(result, { type: "boolean", default: true })
    })

    test("array type", () => {
        const result = promptParameterTypeToJSONSchema([42])
        assert.deepStrictEqual(result, {
            type: "array",
            items: { type: "integer", default: 42 },
        })
    })

    test("object type", () => {
        const result = promptParameterTypeToJSONSchema({ key: "value" })
        assert.deepStrictEqual(result, {
            type: "object",
            properties: { key: { type: "string", default: "value" } },
            required: [],
        })
    })

    test("object required type", () => {
        const result = promptParameterTypeToJSONSchema({
            key: "value",
            key2: { type: "string", required: true },
        })
        assert.deepStrictEqual(result, {
            type: "object",
            properties: {
                key: { type: "string", default: "value" },
                key2: { type: "string" },
            },
            required: ["key2"],
        })
    })

    test("unsupported type", () => {
        assert.throws(() => promptParameterTypeToJSONSchema(() => {}), Error)
    })
})

describe("promptParametersSchemaToJSONSchema", () => {
    test("'value'", () => {
        const parameters = { key: "value" }
        const result = promptParametersSchemaToJSONSchema(parameters)
        assert.deepStrictEqual(result, {
            type: "object",
            properties: { key: { type: "string", default: "value" } },
            required: [],
        })
    })
    test("''", () => {
        const parameters = { key: "" }
        const result = promptParametersSchemaToJSONSchema(parameters)
        assert.deepStrictEqual(result, {
            type: "object",
            properties: { key: { type: "string" } },
            required: ["key"],
        })
    })
    test("123", () => {
        const parameters = { key: 123 }
        const result = promptParametersSchemaToJSONSchema(parameters)
        assert.deepStrictEqual(result, {
            type: "object",
            properties: { key: { type: "integer", default: 123 } },
            required: [],
        })
    })
    test("12.3", () => {
        const parameters = { key: 12.3 }
        const result = promptParametersSchemaToJSONSchema(parameters)
        assert.deepStrictEqual(result, {
            type: "object",
            properties: { key: { type: "number", default: 12.3 } },
            required: [],
        })
    })
    test("NaN", () => {
        const parameters = { key: NaN }
        const result = promptParametersSchemaToJSONSchema(parameters)
        assert.deepStrictEqual(result, {
            type: "object",
            properties: { key: { type: "number" } },
            required: ["key"],
        })
    })
})

describe("proxifyVars", () => {
    test("proxify variables", () => {
        const res = { key: "value" }
        const proxy = proxifyEnvVars(res)
        assert.strictEqual(proxy.key, "value")
    })
})

describe("parametersToVars", () => {
    test("convert parameters to vars", () => {
        const parameters = { key: "value" }
        const result = parametersToVars(parameters)
        assert.deepStrictEqual(result, ["key=value"])
    })
})
