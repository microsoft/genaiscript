system({
    title: "git read operations",
    description: "Tools to query a git repository.",
})

export default async function main(ctx) {
    ctx.defTool(
        "git_branch_default",
        "Gets the default branch using git.",
        {},
        async () => {
            return await git.defaultBranch()
        }
    )

    ctx.defTool(
        "git_branch_current",
        "Gets the current branch using git.",
        {},
        async () => {
            return await git.branch()
        }
    )

    ctx.defTool(
        "git_branch_list",
        "List all branches using git.",
        {},
        async () => {
            return await git.exec("branch")
        }
    )

    ctx.defTool(
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
                count: {
                    type: "number",
                    description: "Number of commits to return",
                },
                author: {
                    type: "string",
                    description: "Author to filter by",
                },
                until: {
                    type: "string",
                    description:
                        "Display commits until the given date. Formatted yyyy-mm-dd",
                },
                after: {
                    type: "string",
                    description:
                        "Display commits after the given date. Formatted yyyy-mm-dd",
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
            const {
                context,
                base,
                head,
                paths,
                excludedPaths,
                count,
                author,
                until,
                after,
            } = args
            const commits = await git.log({
                base,
                head,
                author,
                paths,
                until,
                after,
                excludedPaths,
                count,
            })
            const res = commits
                .map(({ sha, date, message }) => `${sha} ${date} ${message}`)
                .join("\n")
            context.debug(res)
            return res
        }
    )

    ctx.defTool(
        "git_status",
        "Generates a status of the repository using git.",
        {},
        async () => {
            return await git.exec(["status", "--porcelain"])
        }
    )

    ctx.defTool(
        "git_last_tag",
        "Gets the last tag using git.",
        {},
        async () => {
            return await git.lastTag()
        }
    )
}
