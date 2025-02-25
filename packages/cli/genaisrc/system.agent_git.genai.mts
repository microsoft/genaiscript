system({
    title: "Agent that can query Git to accomplish tasks.",
    parameters: {
        cwd: {
            type: "string",
            description: "Current working directory",
            required: false,
        },
        repo: {
            type: "string",
            description: "Repository URL or GitHub slug",
            required: false,
        },
        branch: {
            type: "string",
            description: "Branch to checkout",
            required: false,
        },
        variant: {
            type: "string",
            description: "Suffix to append to the agent name",
            required: false,
        },
    },
})

export default async function defAgentGit(ctx: PromptContext) {
    const { env, defAgent } = ctx
    const { vars } = env
    let cwd = vars["system.agent_git.cwd"]
    const repo = vars["system.agent_git.repo"]
    const branch = vars["system.agent_git.branch"]
    const variant = vars["system.agent_git.variant"]

    if (!cwd && repo) {
        const client = await git.shallowClone(repo, {
            branch,
            depth: 50,
            force: true,
        })
        cwd = client.cwd
    }

    defAgent(
        "git",
        "query the current repository using Git to accomplish tasks. Provide all the context information available to execute git queries.",
        `Your are a helpful LLM agent that can use the git tools to query the current repository.
    Answer the question in <QUERY>.
    - The current repository is the same as github repository.
    - Prefer using diff to compare files rather than listing files. Listing files is only useful when you need to read the content of the files.
    `,
        {
            variant,
            variantDescription:
                (variant && repo) ??
                `query ${repo} repository using Git to accomplish tasks. Provide all the context information available to execute git queries.`,
            system: [
                "system.github_info",
                { id: "system.git_info", parameters: { cwd } },
                { id: "system.git", parameters: { cwd } },
                { id: "system.git_diff", parameters: { cwd } },
            ],
        }
    )
}
