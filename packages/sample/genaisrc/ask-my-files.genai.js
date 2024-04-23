script({
    title: "ask my files",
    system: ["system", "system.fs_find_files", "system.fs_read_file"]
})

defFunction(
    "fs_read_file_summary",
    "Reads a summary of a file from the file system.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description:
                    "Path of the file to load, relative to the workspace.",
            },
            linestart: {
                type: "integer",
                description: "Line number (1-based) to start reading from.",
            },
            lineend: {
                type: "integer",
                description: "Line number (1-based) to end reading at.",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        let { filename, linestart, lineend } = args

        if (/^\.env$/i.test(path.basename(filename)))
            return "File contains sensitive information and cannot be displayed."

        linestart = parseInt(linestart) - 1
        lineend = parseInt(lineend)
        let { content } = await fs.readFile(filename)
        if (!isNaN(linestart) && !isNaN(lineend)) {
            const lines = content.split("\n")
            content = lines.slice(linestart, lineend).join("\n")
        }
        const summary = await runPrompt(_ => {
            const f = _.def("FILE", { filename, content, label: filename })
            _.$`Summarize the content of ${f}. Keep it brief: generate a single sentence title and one paragraph description.`
        })
        return summary.text
    }
)

$`You are an AI assistant. Summarize the content of the files in the file system. Keep it brief.`