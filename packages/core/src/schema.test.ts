import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { JSONSchemaStringifyToTypeScript, toStrictJSONSchema } from "./schema"

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
                            }
                        ]
                    }
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
