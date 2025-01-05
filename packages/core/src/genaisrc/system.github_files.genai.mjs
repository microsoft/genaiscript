system({
    title: "Tools to query GitHub files.",
})

export default function main(ctx) {
    ctx.defTool(
        "github_files_get",
        "Get a file from a repository.",
        {
            type: "object",
            properties: {
                filepath: {
                    type: "string",
                    description: "Path to the file",
                },
                ref: {
                    type: "string",
                    description: "Branch, tag, or commit to get the file from",
                },
            },
            required: ["filepath", "ref"],
        },
        async (args) => {
            const { filepath, ref, context } = args
            context.log(`github file get ${filepath}#${ref}`)
            const res = await github.getFile(filepath, ref)
            return res
        }
    )

    ctx.defTool(
        "github_files_list",
        "List all files in a repository.",
        {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Path to the directory",
                },
                ref: {
                    type: "string",
                    description:
                        "Branch, tag, or commit to get the file from. Uses default branch if not provided.",
                },
            },
            required: ["path"],
        },
        async (args) => {
            const { path, ref = await git.defaultBranch(), context } = args
            context.log(`github file list at ${path}#${ref}`)
            const res = await github.getRepositoryContent(path, { ref })
            return CSV.stringify(res, { header: true })
        }
    )
}
