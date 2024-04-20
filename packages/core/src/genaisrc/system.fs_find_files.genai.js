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
                description: "Search path.",
            },
        },
        required: ["glob"],
    },
    async (args) => {
        const { context, glob } = args
        const res = await fs.findFiles(glob)
        return res.join("\n")
    }
)
