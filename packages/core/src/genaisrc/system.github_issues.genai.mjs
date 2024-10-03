system({
    title: "Tools to query GitHub issues.",
})

defTool(
    "github_issues_list",
    "List all issues in a repository. 'llm_number' is the ID used in other tools.",
    {
        type: "object",
        properties: {
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
                description:
                    "What to sort by: 'created', 'updated', 'comments'",
            },
            direction: {
                type: "string",
                description: "Direction to sort: 'asc', 'desc'",
            },
        },
    },
    async (args) => {
        const { state = "open", labels, sort, direction, context } = args
        context.log(`github issue list ${state ?? "all"}`)
        const res = await github.listIssues({ state, labels, sort, direction })
        return CSV.stringify(
            res.map(({ llm_number, title, state }) => ({
                llm_number,
                title,
                state,
            })),
            { header: true }
        )
    }
)

defTool(
    "github_issues_get",
    "Get a single issue by number. 'llm_number' is the ID used in other tools.",
    {
        type: "object",
        properties: {
            number: {
                type: "number",
                description: "The 'number' of the issue (not the id)",
            },
        },
        required: ["number"],
    },
    async (args) => {
        const { number: issue_number, context } = args
        context.log(`github issue get ${issue_number}`)
        const { llm_number, title, body, state, html_url, reactions } =
            await github.getIssue(issue_number)
        return YAML.stringify({
            llm_number,
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
    "Get comments for an issue. 'llm_id' is the ID used in other tools.",
    {
        type: "object",
        properties: {
            number: {
                type: "number",
                description: "The 'number' of the issue (not the id)",
            },
        },
        required: ["number"],
    },
    async (args) => {
        const { number: issue_number, context } = args
        context.log(`github issue list comments ${issue_number}`)
        const res = await github.listIssueComments(issue_number)
        return CSV.stringify(
            res.map(({ llm_id, body, updated_at }) => ({
                llm_id,
                body,
                updated_at,
            })),
            { header: true }
        )
    }
)
