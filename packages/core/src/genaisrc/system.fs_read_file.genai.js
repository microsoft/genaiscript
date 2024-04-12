system({
    title: "File Read File",
    description: "Function to read file content.",
    group: "Functions"
})

defFunction(
    "fs_read_file",
    "Reads a file as text from the file system.",
    {
        type: "object",
        "properties": {
            "filename": {
                "type": "string",
                "description": "Path of the file to load, relative to the workspace.",
            },
            "linestart": {
                "type": "integer",
                "description": "Line number (1-based) to start reading from.",
            },
            "lineend": {
                "type": "integer",
                "description": "Line number (1-based) to end reading at.",
            },
        },
        "required": ["filename"],
    },
    async (args) => {
        let { context, filename, linestart, lineend } = args
        linestart = parseInt(linestart) - 1
        lineend = parseInt(lineend)
        let { content } = await fs.readFile(filename)
        if (!isNaN(linestart) && !isNaN(lineend)) {
            const lines = content.split("\n")
            content = lines.slice(linestart, lineend).join("\n")
        }
        return content
    }
)