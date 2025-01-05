system({
    title: "git diff",
    description: "Tools to query a git repository.",
})

defTool(
    "git_diff",
    "Computes file diffs using the git diff command. If the diff is too large, it returns the list of modified/added files.",
    {
        type: "object",
        properties: {
            base: {
                type: "string",
                description: "Base branch, ref, commit sha to compare against.",
            },
            head: {
                type: "string",
                description:
                    "Head branch, ref, commit sha to compare. Use 'HEAD' to compare against the current branch.",
            },
            staged: {
                type: "boolean",
                description: "Compare staged changes",
            },
            nameOnly: {
                type: "boolean",
                description: "Show only file names",
            },
            paths: {
                type: "array",
                description: "Paths to compare",
                items: {
                    type: "string",
                    description: "File path or wildcard supported by git",
                },
            },
            excludedPaths: {
                type: "array",
                description: "Paths to exclude",
                items: {
                    type: "string",
                    description: "File path or wildcard supported by git",
                },
            },
        },
    },
    async (args) => {
        const { context, ...rest } = args
        const res = await git.diff({
            llmify: true,
            ...rest,
        })
        return res
    },
    { maxTokens: 20000 }
)
