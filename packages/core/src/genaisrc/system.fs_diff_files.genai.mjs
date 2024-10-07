system({
    title: "File Diff Files",
    description: "Tool to compute a diff betweeen two files.",
})

defTool(
    "fs_diff_files",
    "Computes a diff between two files.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description:
                    "Path of the file to compare, relative to the workspace.",
            },
            otherfilename: {
                type: "string",
                description:
                    "Path of the other file to compare, relative to the workspace.",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { context, filename, otherfilename } = args
        context.log(`diff: ${filename} ${filename}`)
        const f = await workspace.readText(filename)
        const of = await workspace.readText(otherfilename)
        return parsers.diff(f, of)
    },
    {
        maxTokens: 20000,
    }
)
