system({
    title: "Agent that can query Git to accomplish tasks.",
    parameters: {
        cwd: {
            type: "string",
            description: "Current working directory",
            required: false,
        },
        variant: {
            type: "string",
            description: "Suffix to append to the agent name",
            required: false,
        },
    },
})

export default function defAgentGit(ctx: PromptContext) {
    const { env, defAgent } = ctx
    const { vars } = env
    const cwd = vars["system.agent_git.cwd"]
    const variant = vars["system.agent_git.variant"]

    defAgent(
        "git",
        "query a repository using Git to accomplish tasks. Provide all the context information available to execute git queries.",
        `Your are a helpful LLM agent that can use the git tools to query the current repository.
    Answer the question in <QUERY>.
    - The current repository is the same as github repository.
    - Prefer using diff to compare files rather than listing files. Listing files is only useful when you need to read the content of the files.
    `,
        {
            nameSuffix: variant,
            system: [
                { id: "system.git_info", parameters: { cwd } },
                "system.github_info",
                { id: "system.git", parameters: { cwd } },
                { id: "system.git_diff", parameters: { cwd } },
            ],
        }
    )
}
