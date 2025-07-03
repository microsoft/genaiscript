script({ files: [], tests: {} })
const schema = defSchema("SCHEMA", {
    type: "object",
    properties: {
        string: { type: "string" },
        number: { type: "number" },
        boolean: { type: "boolean" },
        integer: { type: "integer" },
    },
    required: ["string", "number", "boolean", "integer"],
})

$`Generate 2 rows of data using the schema ${schema}.`
