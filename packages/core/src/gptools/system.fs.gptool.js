system({
    title: "File System functions",
    description: "Functions to surface file system operations."
})

defFunction(
    "fs_find_files",
    "Finds file matching a glob pattern.",
    {
        "type": "object",
        "properties": {
            "glob": {
                "type": "string",
                "description": "Search path.",
            },
        },
        "required": ["glob"],
    },
    async (args) => {
        const { context, glob } = args
        const res = await context.host.findFiles(glob)
        return res.join("\n")
    }
)

defFunction(
    "fs_read_file",
    "Reads a file as text from the file system.",
    {
        "type": "object",
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
        let res = await context.host.readText(filename)
        if (!isNaN(linestart) && !isNaN(lineend)) {
            const lines = res.split("\n")
            res = lines.slice(linestart, lineend).join("\n")
        }
        return res
    }
)