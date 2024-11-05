system({
    title: "Agent that can query Git to accomplish tasks.",
})

const model = env.vars.agentGitModel

defAgent(
    "git",
    "query a repository using Git to accomplish tasks. Provide all the context information available to execute git queries.",
    `Your are a helpful LLM agent that can use the git tools to query the current repository.
    Answer the question in QUERY.
    - The current repository is the same as github repository.
    - Prefer using diff to compare files rather than listing files. Listing files is only useful when you need to read the content of the files. 
    `,
    {
        model,
        system: [
            "system.git_info",
            "system.github_info",
            "system.git",
            "system.git_diff",
        ],
    }
)
