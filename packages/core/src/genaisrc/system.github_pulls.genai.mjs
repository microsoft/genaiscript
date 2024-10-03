system({
    title: "Tools to query GitHub pull requests.",
})

defTool(
    "github_pulls_list",
    "List all pull requests in a repository. 'llm_number' is the ID used in other tools.",
    {
        type: "object",
        properties: {
            state: {
                type: "string",
                description:
                    "state of the pull request from  'open, 'closed', 'all'. Default is 'open'.",
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
        const { context, state, sort, direction } = args
        context.log(`github pull list`)
        const res = await github.listPullRequests({ state, sort, direction })
        return CSV.stringify(
            res.map(({ number, llm_number, title, state, body }) => ({
                number,
                llm_number,
                title,
                state,
            })),
            { header: true }
        )
    }
)

defTool(
    "github_pulls_get",
    "Get a single pull request by number. 'llm_number' is the ID used in other tools.",
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
        const { number, llm_number, title, body, state, html_url, reactions } =
            await github.getPullRequest(pull_number)
        return YAML.stringify({
            number,
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
    "github_pulls_review_comments_list",
    "Get review comments for a pull request. 'llm_id' is the ID used in other tools.",
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
            res.map(({ id, llm_id, body }) => ({ id, llm_id, body })),
            { header: true }
        )
    }
)
