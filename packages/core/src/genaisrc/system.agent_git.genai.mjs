system({
    title: "Agent that can query Git to accomplish tasks.",
})

const model = env.vars.agentGitModel

defAgent(
    "git",
    "Agent that can query a repository using Git to accomplish tasks. Provide all the context information available to execute git queries.",
    `Your are a helpfull LLM agent that can use git tools to query a repository. `,
    { model, tools: ["git"] }
)
