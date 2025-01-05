system({
    title: "Tools to query GitHub issues.",
})

export default function main(ctx) {
    ctx.defTool(
        "github_issues_list",
        "List all issues in a repository.",
        {
            type: "object",
            properties: {
                state: {
                    type: "string",
                    enum: ["open", "closed", "all"],
                    description:
                        "state of the issue from  'open, 'closed', 'all'. Default is 'open'.",
                },
                count: {
                    type: "number",
                    description: "Number of issues to list. Default is 20.",
                },
                labels: {
                    type: "string",
                    description: "Comma-separated list of labels to filter by.",
                },
                sort: {
                    type: "string",
                    enum: ["created", "updated", "comments"],
                    description: "What to sort by",
                },
                direction: {
                    type: "string",
                    enum: ["asc", "desc"],
                    description: "Direction to sort",
                },
                creator: {
                    type: "string",
                    description: "Filter by creator",
                },
                assignee: {
                    type: "string",
                    description: "Filter by assignee",
                },
                since: {
                    type: "string",
                    description:
                        "Only issues updated at or after this time are returned.",
                },
                mentioned: {
                    type: "string",
                    description: "Filter by mentioned user",
                },
            },
        },
        async (args) => {
            const {
                state = "open",
                labels,
                sort,
                direction,
                context,
                creator,
                assignee,
                since,
                mentioned,
                count,
            } = args
            context.log(`github issue list ${state ?? "all"}`)
            const res = await github.listIssues({
                state,
                labels,
                sort,
                direction,
                creator,
                assignee,
                since,
                mentioned,
                count,
            })
            return CSV.stringify(
                res.map(({ number, title, state, user, assignee }) => ({
                    number,
                    title,
                    state,
                    user: user?.login || "",
                    assignee: assignee?.login || "",
                })),
                { header: true }
            )
        }
    )

    ctx.defTool(
        "github_issues_get",
        "Get a single issue by number.",
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
            const {
                number,
                title,
                body,
                state,
                html_url,
                reactions,
                user,
                assignee,
            } = await github.getIssue(issue_number)
            return YAML.stringify({
                number,
                title,
                body,
                state,
                user: user?.login || "",
                assignee: assignee?.login || "",
                html_url,
                reactions,
            })
        }
    )

    ctx.defTool(
        "github_issues_comments_list",
        "Get comments for an issue.",
        {
            type: "object",
            properties: {
                number: {
                    type: "number",
                    description: "The 'number' of the issue (not the id)",
                },
                count: {
                    type: "number",
                    description: "Number of comments to list. Default is 20.",
                },
            },
            required: ["number"],
        },
        async (args) => {
            const { number: issue_number, context, count } = args
            context.log(`github issue list comments ${issue_number}`)
            const res = await github.listIssueComments(issue_number, { count })
            return CSV.stringify(
                res.map(({ id, user, body, updated_at }) => ({
                    id,
                    user: user?.login || "",
                    body,
                    updated_at,
                })),
                { header: true }
            )
        }
    )
}
