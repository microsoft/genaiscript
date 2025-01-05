system({
    title: "Agent that can query GitHub to accomplish tasks.",
})

const model = env.vars.agentGithubModel

defAgent(
    "github",
    "query GitHub to accomplish tasks",
    `Your are a helpful LLM agent that can query GitHub to accomplish tasks. Answer the question in QUERY.
    - Prefer diffing job logs rather downloading entire logs which can be very large.
    - Always return sha, head_sha information for runs
    - do NOT return full job logs, they are too large and will fill the response buffer.
    `,
    {
        model,
        system: [
            "system.tools",
            "system.explanations",
            "system.github_info",
            "system.github_actions",
            "system.github_files",
            "system.github_issues",
            "system.github_pulls",
        ],
    }
)
