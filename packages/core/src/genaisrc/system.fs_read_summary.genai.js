system({
    title: "File Read Summary",
    description: "Function to summarize the content of a file.",
    parameters: {
        model: {
            type: "string",
            description: "LLM model to use",
            default: "gpt-35-turbo",
        },
    },
})

defTool(
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
        const { content } = await workspace.readText(filename)
        const model = (env.vars["system.fs_read_summary.model"] || "gpt-35-turbo") + ""
        const cacheName = `fs_read_summary_${model}`
        const summary = await runPrompt(
            (_) => {
                const f = _.def(
                    "FILE",
                    { filename, content },
                    { maxTokens: 12000 }
                )
                _.$`Summarize the content of ${f}. Keep it brief: generate a single sentence title and one paragraph description.`
            },
            {
                model,
                cache: true,
                cacheName,
            }
        )
        return summary.text
    }
)
