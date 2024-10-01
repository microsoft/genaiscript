system({
    title: "git read operations",
    description: "Various tools to explore git.",
})

defTool("git_current_branch", "Gets the current branch.", {}, async () => {
    return await git.branch()
})

defTool("git_list_branches", "List all branches.", {}, async () => {
    return await git.exec("branch")
})

defTool(
    "git_diff",
    "Generates concise file diffs.",
    {
        base: {
            type: "string",
            description:
                "Base branch to compare against. Use 'BASE' to compare against the repository default branch.",
        },
        head: {
            type: "string",
            description: "Head branch to compare",
        },
        staged: {
            type: "boolean",
            description: "Compare staged changes",
        },
        paths: {
            type: "string[]",
            description: "Paths to compare",
        },
        excludedPaths: {
            type: "string[]",
            description: "Paths to exclude",
        },
    },
    async (args) => {
        let { base, context, ...rest } = args
        if (base === "DEFAULT") base = await git.defaultBranch()
        const res = await git.diff({ llmify: true, ...rest })
        return res
    }
)
