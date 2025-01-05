system({
    title: "File Ask File",
    description: "Run an LLM query against the content of a file.",
})

defTool(
    "fs_ask_file",
    "Runs a LLM query over the content of a file. Use this tool to extract information from a file.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description:
                    "Path of the file to load, relative to the workspace.",
            },
            query: {
                type: "string",
                description: "Query to run over the file content.",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { filename, query, context } = args
        if (!filename) return "MISSING_INFO: filename is missing"
        const file = await workspace.readText(filename)
        if (!file) return "MISSING_INFO: File not found"
        if (!file.content)
            return "MISSING_INFO: File content is empty or the format is not readable"

        return await runPrompt(
            (_) => {
                _.$`Answer the QUERY with the content in FILE.`
                _.def("FILE", file, { maxTokens: 28000 })
                _.def("QUERY", query)

                $`- Use the content in FILE exclusively to create your answer.
                - If you are missing information, reply "MISSING_INFO: <what is missing>".
                - If you cannot answer the query, return "NO_ANSWER: <reason>".`
            },
            {
                model: "small",
                cache: "fs_ask_file",
                label: `ask file ${filename}`,
                system: [
                    "system",
                    "system.explanations",
                    "system.safety_harmful_content",
                    "system.safety_protected_material",
                ],
            }
        )
    },
    {
        maxTokens: 1000,
    }
)
