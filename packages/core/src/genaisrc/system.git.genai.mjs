system({
    title: "git read operations",
    description: "Tools to query a git repository.",
})

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
    "Computes file diffs using git.",
    {
        type: "object",
        properties: {
            base: {
                type: "string",
                description:
                    "Base branch, ref, commit sha to compare against. Use 'DEFAULT' to compare against the repository default branch.",
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
        let { base, context, excludedPaths, ...rest } = args
        if (base === "DEFAULT") base = await git.defaultBranch()
        const res = await git.diff({
            llmify: true,
            base,
            excludedPaths,
            ...rest,
        })
        return res
    }
)

defTool(
    "git_log",
    "Generates a log of commits using git.",
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
