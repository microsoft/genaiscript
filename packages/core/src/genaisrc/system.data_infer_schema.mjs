system({
    description: "Tools to infer the schema of a dataset or file",
})

defTool(
    "data_infer_schema",
    "Infers the JSON schema of a file",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "The filename to infer the schema from",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { filename, data } = args
        const jsonData = await workspace.readData(filename)
        if (jsonData === undefined)
            return "Unabled to infer the schema from the data."

        const schema = await JSONSchema.infer(jsonData)
        return JSON.stringify(schema)
    }
)
