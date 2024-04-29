system({
    title: "File Find Files",
    description: "Functions to list files.",
})

defFunction(
    "fs_find_files",
    "Finds file matching a glob pattern.",
    {
        type: "object",
        properties: {
            glob: {
                type: "string",
                description: "Search path in glob format, including the relative path from the project root folder.",
            }
        },
        required: ["glob"],
    },
    async (args) => {
        const { glob } = args
        const res = await workspace.findFiles(glob)
        return res.join("\n")
    }
)
