system({
    title: "File Read Summary",
    description: "Function to summarize the content of a file.",
})

defFunction(
    "fs_read_summary",
    "Reads a summary of a file from the file system.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description:
                    "Path of the file to load, relative to the workspace.",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { filename } = args
        if (!filename) return ""
        const { content } = await fs.readText(filename)
        const summary = await runPrompt(_ => {
            const f = _.def("FILE", { filename, content, label: filename }, { maxTokens: 12000 })
            _.$`Summarize the content of ${f}. Keep it brief: generate a single sentence title and one paragraph description.`
        }, {
            model: "gpt-3.5-turbo",
            cache: true,
            cacheName: "fs_read_summary"
        })
        return summary.text
    }
)
