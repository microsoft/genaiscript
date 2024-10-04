system({
    title: "Agent that can query Git to accomplish tasks.",
})

const model = env.vars.agentGitModel

defAgent(
    "git",
    "Agent that can query a repository using Git to accomplish tasks. Provide all the context information available to execute git queries.",
    `Your are a helpfull LLM agent that can use the git tools to query the current repository.
    Answer the question in QUERY.
    - The current repository is the same as github repository.`,
    { model, system: ["system.github_info"], tools: ["git"] }
)
