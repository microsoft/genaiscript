import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {
    JSONSchemaInfer,
    JSONSchemaStringify,
    JSONSchemaStringifyToTypeScript,
    JSONSchemaToFunctionParameters,
    toStrictJSONSchema,
    tryValidateJSONWithSchema,
    validateJSONWithSchema,
    validateSchema,
} from "./schema"
import { MarkdownTrace } from "./trace"

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
    })
    test("city", () => {
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
        assert.deepStrictEqual(result.properties["age"].type, [
            "number",
            "null",
        ])
        assert.strictEqual(result.additionalProperties, false)
    })

    test("infer object", async () => {
        const obj = { name: "John", age: 30 }
        const schema = await JSONSchemaInfer(obj)
        //console.log({ obj, schema })
        assert.strictEqual(schema.type, "object")
        assert.deepStrictEqual(schema.properties, {
            name: { type: "string" },
            age: { type: "integer" },
        })
    })

    test("infer array", async () => {
        const obj = { links: [""] }
        const schema = await JSONSchemaInfer(obj)
        //console.log({ obj, schema })
        assert.strictEqual(schema.type, "object")
        assert.deepStrictEqual(schema.properties, {
            links: { type: "array", items: { type: "string" } },
        })
    })
    test("validateJSONWithSchema - missing required field", () => {
        const schema: JSONSchema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name", "age"],
        }

        const object = { name: "John" }
        const result = validateJSONWithSchema(object, schema)
        assert.strictEqual(result.pathValid, false)
        assert.ok(result.schemaError)
    })

    test("validateJSONWithSchema - additional properties", () => {
        const schema: JSONSchema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name"],
            additionalProperties: false,
        }

        const object = { name: "John", age: 30, extra: "extra value" }
        const result = validateJSONWithSchema(object, schema)
        assert.strictEqual(result.pathValid, false)
        assert.ok(result.schemaError)
    })

    test("JSONSchemaStringify - nested objects", () => {
        const schema: JSONSchema = {
            type: "object",
            properties: {
                user: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        age: { type: "number" },
                    },
                    required: ["name"],
                },
            },
            required: ["user"],
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

    test("validateSchema - invalid schema", async () => {
        const schema: JSONSchema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "invalidType" as any },
            },
            required: ["name"],
        }

        const result = await validateSchema(schema)
        assert.strictEqual(result, false)
    })
    test("tryValidateJSONWithSchema - valid object with schema", () => {
        const schema: JSONSchema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name"],
        }

        const object = { name: "John", age: 30 }
        const result = tryValidateJSONWithSchema(object, { schema })
        assert.deepStrictEqual(result, object)
    })

    test("tryValidateJSONWithSchema - invalid object with schema", () => {
        const schema: JSONSchema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name"],
        }

        const object = { age: 30 }
        const result = tryValidateJSONWithSchema(object, { schema })
        assert.strictEqual(result, undefined)
    })

    test("tryValidateJSONWithSchema - valid object without schema", () => {
        const object = { name: "John", age: 30 }
        const result = tryValidateJSONWithSchema(object)
        assert.deepStrictEqual(result, object)
    })

    test("tryValidateJSONWithSchema - invalid schema with throwOnSchemaError", () => {
        const schema: JSONSchema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "invalidType" as any },
            },
            required: ["name"],
        }

        const object = { name: "John" }
        assert.throws(() => {
            tryValidateJSONWithSchema(object, {
                schema,
                throwOnValidationError: true,
            })
        }, /schema is invalid/)
    })

    test("tryValidateJSONWithSchema - valid object with trace", () => {
        const schema: JSONSchema = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name"],
        }

        const object = { name: "John", age: 30 }
        const trace = new MarkdownTrace()
        const result = tryValidateJSONWithSchema(object, { schema, trace })
        assert.deepStrictEqual(result, object)
    })
    test("JSONSchemaToFunctionParameters - primitive types", () => {
        assert.strictEqual(JSONSchemaToFunctionParameters("string"), "string")
        assert.strictEqual(JSONSchemaToFunctionParameters("number"), "number")
        assert.strictEqual(JSONSchemaToFunctionParameters("integer"), "number")
        assert.strictEqual(JSONSchemaToFunctionParameters("boolean"), "boolean")
        assert.strictEqual(JSONSchemaToFunctionParameters("null"), "null")
    })

    test("JSONSchemaToFunctionParameters - anyOf types", () => {
        const schema: JSONSchemaAnyOf = {
            anyOf: [{ type: "string" }, { type: "number" }],
        }
        assert.strictEqual(
            JSONSchemaToFunctionParameters(schema),
            "string | number"
        )
    })

    test("JSONSchemaToFunctionParameters - array type", () => {
        const schema: JSONSchemaArray = {
            type: "array",
            items: { type: "string" },
        }
        assert.strictEqual(
            JSONSchemaToFunctionParameters(schema),
            "{ string }[]"
        )
    })

    test("JSONSchemaToFunctionParameters - object type", () => {
        const schema: JSONSchemaObject = {
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
            },
            required: ["name"],
        }
        assert.strictEqual(
            JSONSchemaToFunctionParameters(schema),
            "name: string, age?: number"
        )
    })

    test("JSONSchemaToFunctionParameters - nested object", () => {
        const schema: JSONSchemaObject = {
            type: "object",
            properties: {
                user: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        age: { type: "number" },
                    },
                    required: ["name"],
                },
            },
            required: ["user"],
        }
        assert.strictEqual(
            JSONSchemaToFunctionParameters(schema),
            "user: { name: string, age?: number }"
        )
    })

    test("JSONSchemaToFunctionParameters - unsupported schema", () => {
        const schema: any = { type: "unsupported" }
        assert.strictEqual(JSONSchemaToFunctionParameters(schema), "?")
    })
})
