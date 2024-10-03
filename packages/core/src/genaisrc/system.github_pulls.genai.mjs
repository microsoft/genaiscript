system({
    title: "Tools to query GitHub pull requests.",
})

defTool(
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
        },
    },
    async (args) => {
        const { context, state, sort, direction } = args
        context.log(`github pull list`)
        const res = await github.listPullRequests({ state, sort, direction })
        return CSV.stringify(
            res.map(({ number, title, state, body }) => ({
                number,
                title,
                state,
            })),
            { header: true }
        )
    }
)

defTool(
    "github_pulls_get",
    "Get a single pull request by number.",
    {
        type: "object",
        properties: {
            number: {
                type: "number",
                description: "The 'number' of the pull request (not the id)",
            },
        },
        required: ["number"],
    },
    async (args) => {
        const { number: pull_number, context } = args
        context.log(`github pull get ${pull_number}`)
        const { number, title, body, state, html_url, reactions } =
            await github.getPullRequest(pull_number)
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
    "github_pulls_review_comments_list",
    "Get review comments for a pull request.",
    {
        type: "object",
        properties: {
            number: {
                type: "number",
                description: "The 'number' of the pull request (not the id)",
            },
        },
        required: ["number"],
    },

    async (args) => {
        const { number: pull_number, context } = args
        context.log(`github pull comments list ${pull_number}`)
        const res = await github.listPullRequestReviewComments(pull_number)
        return CSV.stringify(
            res.map(({ id, body }) => ({ id, body })),
            { header: true }
        )
    }
)
