system({
    title: "git read operations",
    description: "Tools to query a git repository.",
})

defTool(
    "git_branch_default",
    "Gets the default branch using git.",
    {},
    async () => {
        return await git.defaultBranch()
    }
)

defTool(
    "git_branch_current",
    "Gets the current branch using git.",
    {},
    async () => {
        return await git.branch()
    }
)

defTool("git_branch_list", "List all branches using git.", {}, async () => {
    return await git.exec("branch")
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

defTool(
    "git_list_commits",
    "Generates a history of commits using the git log command.",
    {
        type: "object",
        properties: {
            base: {
                type: "string",
                description: "Base branch to compare against.",
            },
            head: {
                type: "string",
                description: "Head branch to compare",
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
        const { base, head, paths, excludedPaths } = args
        const commits = await git.log({ base, head, paths, excludedPaths })
        return commits.map(({ sha, message }) => `${sha} ${message}`).join("\n")
    }
)

defTool(
    "git_status",
    "Generates a status of the repository using git.",
    {},
    async () => {
        return await git.exec(["status", "--porcelain"])
    }
)

defTool("git_last_tag", "Gets the last tag using git.", {}, async () => {
    return await git.lastTag()
})
