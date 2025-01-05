system({
    title: "Tools to query GitHub pull requests.",
})

export default async function main(ctx) {
    const pr = await github.getPullRequest()
    if (pr) {
        ctx.$`- current pull request number: ${pr.number}
    - current pull request base ref: ${pr.base.ref}`
    }

    ctx.defTool(
        "github_pulls_list",
        "List all pull requests in a repository.",
        {
            type: "object",
            properties: {
                state: {
                    type: "string",
                    enum: ["open", "closed", "all"],
                    description:
                        "state of the pull request from  'open, 'closed', 'all'. Default is 'open'.",
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
                count: {
                    type: "number",
                    description:
                        "Number of pull requests to list. Default is 20.",
                },
            },
        },
        async (args) => {
            const { context, state, sort, direction, count } = args
            context.log(`github pull list`)
            const res = await github.listPullRequests({
                state,
                sort,
                direction,
                count,
            })
            return CSV.stringify(
                res.map(({ number, title, state, body, user, assignee }) => ({
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
        "github_pulls_get",
        "Get a single pull request by number.",
        {
            type: "object",
            properties: {
                number: {
                    type: "number",
                    description:
                        "The 'number' of the pull request (not the id)",
                },
            },
            required: ["number"],
        },
        async (args) => {
            const { number: pull_number, context } = args
            context.log(`github pull get ${pull_number}`)
            const {
                number,
                title,
                body,
                state,
                html_url,
                reactions,
                user,
                assignee,
            } = await github.getPullRequest(pull_number)
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
        "github_pulls_review_comments_list",
        "Get review comments for a pull request.",
        {
            type: "object",
            properties: {
                number: {
                    type: "number",
                    description:
                        "The 'number' of the pull request (not the id)",
                },
                count: {
                    type: "number",
                    description: "Number of runs to list. Default is 20.",
                },
            },
            required: ["number"],
        },

        async (args) => {
            const { number: pull_number, context, count } = args
            context.log(`github pull comments list ${pull_number}`)
            const res = await github.listPullRequestReviewComments(
                pull_number,
                {
                    count,
                }
            )
            return CSV.stringify(
                res.map(({ id, user, body }) => ({
                    id,
                    user: user?.login || "",
                    body,
                })),
                { header: true }
            )
        }
    )
}
