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
        },
        "required": ["filename"],
    },
    async (args) => {
        const { context, filename } = args
        const res = await context.host.readText(filename)
        return res
    }
)