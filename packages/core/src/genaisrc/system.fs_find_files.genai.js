system({
    title: "File find files",
    description: "Find files with glob and content regex.",
})

defTool(
    "fs_find_files",
    "Finds file matching a glob pattern. Use pattern to specify a regular expression to search for in the file content.",
    {
        type: "object",
        properties: {
            glob: {
                type: "string",
                description:
                    "Search path in glob format, including the relative path from the project root folder.",
            },
            pattern: {
                type: "string",
                description: "Optional regular expression pattern to search for in the file content.",
            }
        },
        required: ["glob"],
    },
    async (args) => {
        const { glob, pattern } = args
        console.log(pattern ? `grep ${pattern} ${glob}` : `ls ${glob}`)
        const res = pattern ? (await (workspace.grep(pattern, glob, { readText: false }))).files : await workspace.findFiles(glob, { readText: false })
        if (!res?.length) return "No files found."
        return res.map((f) => f.filename).join("\n")
    }
)
