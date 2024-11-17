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
            line: {
                type: "integer",
                description:
                    "Line number (starting at 1) to read with a few lines before and after.",
            },
            line_start: {
                type: "integer",
                description:
                    "Line number (starting at 1) to start reading from.",
            },
            line_end: {
                type: "integer",
                description: "Line number (starting at 1) to end reading at.",
            },
            line_numbers: {
                type: "boolean",
                description: "Whether to include line numbers in the output.",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        let { filename, line, line_start, line_end, line_numbers, context } =
            args
        if (!filename) return "<MISSING>filename</MISSING>"
        if (!isNaN(line)) {
            line_start = Math.max(1, line - 5)
            line_end = Math.max(1, line + 5)
        }
        const hasRange = !isNaN(line_start) && !isNaN(line_end)
        if (hasRange) {
            line_start = Math.max(1, line_start)
            line_end = Math.max(1, line_end)
        }
        let content
        try {
            context.log(
                `cat ${filename}${hasRange ? ` | sed -n '${line_start},${line_end}p'` : ""}`
            )
            const res = await workspace.readText(filename)
            content = res.content ?? ""
        } catch (e) {
            return "<FILE_NOT_FOUND>"
        }
        if (line_numbers || hasRange) {
            const lines = content.split("\n")
            content = lines.map((line, i) => `[${i + 1}] ${line}`).join("\n")
        }
        if (!isNaN(line_start) && !isNaN(line_end)) {
            const lines = content.split("\n")
            content = lines.slice(line_start, line_end).join("\n")
        }
        return content
    },
    {
        maxTokens: 10000,
    }
)
