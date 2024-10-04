system({
    title: "Agent that can query GitHub to accomplish tasks.",
})

const model = env.vars.agentGithubModel

defAgent(
    "github",
    "Agent that can query GitHub  to accomplish tasks",
    `Your are a helpfull LLM agent that can query GitHub to accomplish tasks.
    Prefer diffing job logs rather downloading entire logs which can be very large.`,
    {
        model,
        system: [
            "system",
            "system.tools",
            "system.explanations",
            "system.github_actions",
            "system.github_files",
            "system.github_issues",
            "system.github_pulls",
        ],
    }
)
