system({
    description: "A tool that can query data in a file",
})

export default function (ctx: PromptContext) {
    const { defTool } = ctx

    defTool(
        "fs_data_query",
        "Query data in a file using GROQ syntax",
        {
            type: "object",
            properties: {
                filename: {
                    type: "string",
                    description: "The filename to query data from",
                },
                query: {
                    type: "string",
                    description: "The GROQ query to run on the data",
                },
            },
        },
        async (args) => {
            const { context, query, filename } = args
            context.log(`query ${query} in ${filename}`)
            const data = await workspace.readData(filename)
            const res = await parsers.GROQ(query, data)
            return res
        }
    )
}
