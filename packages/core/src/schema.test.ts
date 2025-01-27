import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {
    JSONSchemaInfer,
    JSONSchemaStringify,
    JSONSchemaStringifyToTypeScript,
    toStrictJSONSchema,
    validateJSONWithSchema,
    validateSchema,
} from "./schema"

describe("schema", () => {
    test("cities", () => {
        const source: JSONSchema = {
            type: "array",
            description:
                "A list of cities with population and elevation information.",
            items: {
                type: "object",
                description:
                    "A city with population and elevation information.",
                properties: {
                    name: {
                        type: "string",
                        description: "The name of the city.",
                    },
                    population: {
                        type: "number",
                        description: "The population of the city.",
                    },
                    url: {
                        type: "string",
                        description: "The URL of the city's Wikipedia page.",
                    },
                    extra: {
                        anyOf: [
                            {
                                type: "string",
                            },
                            {
                                type: "number",
                            },
                        ],
                    },
                },
                required: ["name", "population", "url"],
            },
        }

        const ts = JSONSchemaStringifyToTypeScript(source, { typeName: "Foo" })
        //   console.log(ts)
        assert.equal(
            ts,
            "// A list of cities with population and elevation information.\n" +
                "type Foo = Array<{\n" +
                "    // The name of the city.\n" +
                "    name: string,\n" +
                "    // The population of the city.\n" +
                "    population: number,\n" +
                "    // The URL of the city's Wikipedia page.\n" +
                "    url: string,\n" +
                "    extra?: string | number,\n" +
                "  }>"
        )
    }),
        test("city", () => {
            const source: JSONSchema = {
                type: "object",
                description:
                    "A city with population and elevation information.",
                properties: {
                    name: {
                        type: "string",
                        description: "The name of the city.",
                    },
                    population: {
                        type: "number",
                        description: `The population 
of the city.`,
                    },
                    url: {
                        type: "string",
                        description: "The URL of the city's Wikipedia page.",
                    },
                },
                required: ["name", "url"],
            }

            const ts = JSONSchemaStringifyToTypeScript(source)
            //  console.log(ts)
            assert.equal(
                ts,
                "// A city with population and elevation information.\n" +
                    "type Response = {\n" +
                    "  // The name of the city.\n" +
                    "  name: string,\n" +
                    "  /* The population \n" +
                    "  of the city. */\n" +
                    "  population?: number,\n" +
                    "  // The URL of the city's Wikipedia page.\n" +
                    "  url: string,\n" +
                    "}"
            )
        })
    test("strict", () => {
        const source: JSONSchema = {
            type: "object",
            description: "A city with population and elevation information.",
            properties: {
                name: {
                    type: "string",
                    description: "The name of the city.",
                },
                population: {
                    type: "number",
                    description: `The population 
of the city.`,
                },
                url: {
                    type: "string",
                    description: "The URL of the city's Wikipedia page.",
                },
            },
            required: ["url"],
        }

        const res = toStrictJSONSchema(source)
        assert.deepStrictEqual(res.required, ["url", "name", "population"])
        assert.deepStrictEqual(res.properties["url"].type, "string")
        assert.deepStrictEqual(res.properties["name"].type, ["string", "null"])
        assert.strictEqual(res.additionalProperties, false)
    })
})

test("validateSchema", async () => {
    const schema: JSONSchema = {
        type: "object",
        properties: {
            name: { type: "string" },
            age: { type: "number" },
        },
        required: ["name"],
    }

    const result = await validateSchema(schema)
    assert.strictEqual(result, true)
})

test("validateJSONWithSchema - valid object", () => {
    const schema: JSONSchema = {
        type: "object",
        properties: {
            name: { type: "string" },
            age: { type: "number" },
        },
        required: ["name"],
    }

    const object = { name: "John", age: 30 }
    const result = validateJSONWithSchema(object, schema)
    assert.strictEqual(result.pathValid, true)
    assert.strictEqual(result.schemaError, undefined)
})

test("validateJSONWithSchema - invalid object", () => {
    const schema: JSONSchema = {
        type: "object",
        properties: {
            name: { type: "string" },
            age: { type: "number" },
        },
        required: ["name"],
    }

    const object = { age: 30 }
    const result = validateJSONWithSchema(object, schema)
    assert.strictEqual(result.pathValid, false)
    assert.ok(result.schemaError)
})

test("JSONSchemaStringify", () => {
    const schema: JSONSchema = {
        type: "object",
        properties: {
            name: { type: "string" },
            age: { type: "number" },
        },
        required: ["name"],
    }

    const result = JSONSchemaStringify(schema)
    assert.strictEqual(
        result,
        JSON.stringify(
            {
                $schema: "http://json-schema.org/draft-07/schema#",
                ...schema,
            },
            null,
            2
        )
    )
})

test("toStrictJSONSchema", () => {
    const schema: JSONSchema = {
        type: "object",
        properties: {
            name: { type: "string" },
            age: { type: "number" },
        },
        required: ["name"],
    }

    const result = toStrictJSONSchema(schema)
    assert.deepStrictEqual(result.required, ["name", "age"])
    assert.deepStrictEqual(result.properties["name"].type, "string")
    assert.deepStrictEqual(result.properties["age"].type, ["number", "null"])
    assert.strictEqual(result.additionalProperties, false)
})

test("JSONSchemaInfer", async () => {
    const obj = { name: "John", age: 30 }
    const schema = await JSONSchemaInfer(obj)
    console.log({ obj, schema })
    assert.strictEqual(schema.type, "object")
    assert.deepStrictEqual(schema.properties, {
        name: { type: "string" },
        age: { type: "integer" },
    })
})
