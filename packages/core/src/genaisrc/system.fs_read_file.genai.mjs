system({
    title: "File Read File",
    description: "Function to read file content as text.",
})

defTool(
    "fs_read_file",
    "Reads a file as text from the file system. Returns undefined if the file does not exist.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description:
                    "Path of the file to load, relative to the workspace.",
            },
            line_start: {
                type: "integer",
                description: "Line number (1-based) to start reading from.",
            },
            line_end: {
                type: "integer",
                description: "Line number (1-based) to end reading at.",
            },
            line_numbers: {
                type: "boolean",
                description: "Whether to include line numbers in the output.",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        let { filename, line_start, line_end, line_numbers, context } = args
        if (!filename) return ""
        line_start = parseInt(line_start) - 1
        line_end = parseInt(line_end)
        let content
        try {
            context.log(`cat ${filename}`)
            const res = await workspace.readText(filename)
            content = res.content ?? ""
        } catch (e) {
            return undefined
        }
        if (line_numbers) {
            const lines = content.split("\n")
            content = lines.map((line, i) => `[${i + 1}] ${line}`).join("\n")
        }
        if (!isNaN(line_start) && !isNaN(line_end)) {
            const lines = content.split("\n")
            content = lines.slice(line_start, line_end).join("\n")
        }
        return content
    }
)
