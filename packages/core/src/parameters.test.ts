import { describe, test } from "node:test"
import assert from "node:assert"
import { NotSupportedError } from "./error"

import {
    promptParameterTypeToJSONSchema,
    promptParametersSchemaToJSONSchema,
    proxifyVars,
    parametersToVars,
} from "./parameters"

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
        assert.deepStrictEqual(result, { type: "number", default: 42 })
    })

    test("boolean type", () => {
        const result = promptParameterTypeToJSONSchema(true)
        assert.deepStrictEqual(result, { type: "boolean", default: true })
    })

    test("array type", () => {
        const result = promptParameterTypeToJSONSchema([42])
        assert.deepStrictEqual(result, {
            type: "array",
            items: { type: "number", default: 42 },
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
        assert.throws(
            () => promptParameterTypeToJSONSchema(() => {}),
            NotSupportedError
        )
    })
})

describe("promptParametersSchemaToJSONSchema", () => {
    test("convert parameters schema to JSON schema", () => {
        const parameters = { key: "value" }
        const result = promptParametersSchemaToJSONSchema(parameters)
        assert.deepStrictEqual(result, {
            type: "object",
            properties: { key: { type: "string", default: "value" } },
            required: [],
        })
    })
})

describe("proxifyVars", () => {
    test("proxify variables", () => {
        const res = { key: "value" }
        const proxy = proxifyVars(res)
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
