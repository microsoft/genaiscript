system({
    title: "Tools to query GitHub issues.",
})

defTool(
    "github_issues_list",
    "List all issues in a repository.",
    {
        state: {
            type: "string",
            description:
                "state of the issue from  'open, 'closed', 'all'. Default is 'open'.",
        },
        labels: {
            type: "string",
            description: "Comma-separated list of labels to filter by.",
        },
        sort: {
            type: "string",
            description: "What to sort by: 'created', 'updated', 'comments'",
        },
        direction: {
            type: "string",
            description: "Direction to sort: 'asc', 'desc'",
        },
    },
    async (args) => {
        const { state = "open", labels, sort, direction, context } = args
        context.log(`github issue list ${state ?? "all"}`)
        const res = await github.listIssues({ state, labels, sort, direction })
        return CSV.stringify(
            res.map(({ number, title, state }) => ({ number, title, state })),
            { header: true }
        )
    }
)

defTool(
    "github_issues_get",
    "Get a single issue by number.",
    { number: "number" },
    async (args) => {
        const { number: issue_number, context } = args
        context.log(`github issue get ${issue_number}`)
        const { number, title, body, state, html_url, reactions } =
            await github.getIssue(issue_number)
        return YAML.stringify({
            number,
            title,
            body,
            state,
            html_url,
            reactions,
        })
    }
)

defTool(
    "github_issues_comments_list",
    "Get comments for an issue.",
    { number: "number" },
    async (args) => {
        const { number: issue_number, context } = args
        context.log(`github issue list comments ${issue_number}`)
        const res = await github.listIssueComments(issue_number)
        return CSV.stringify(
            res.map(({ id, body, updated_at }) => ({
                id,
                body,
                updated_at,
            })),
            { header: true }
        )
    }
)
