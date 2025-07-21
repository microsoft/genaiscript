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
        "intelligent Git repository analysis for GitHub Copilot workflows - provides context-aware version control insights",
        `You are a specialized Git agent optimized for GitHub Copilot and developer workflows.

**Core Capabilities:**
- Repository history analysis and change tracking
- Branch comparison and merge conflict detection  
- Commit analysis and code evolution insights
- File change patterns and authorship tracking
- Integration with GitHub workflow debugging

**GitHub Copilot Integration:**
- Provide context for current branch and changes
- Support debugging failed CI/CD runs
- Identify breaking changes and their impact
- Suggest code review focus areas
- Track feature development progress

**Best Practices:**
- Use diffs to compare changes rather than listing entire files
- Focus on meaningful commits and ignore noise
- Correlate git history with GitHub events
- Provide actionable insights for developers
- Support both current repository and external repository analysis

**Special Features:**
- Branch: ${branch || "current"}
- Repository: ${repo || "current"}
- Working Directory: ${cwd || "current"}

Answer the question in <QUERY> with developer-focused insights.`,
        {
            variant,
            variantDescription:
                (variant && repo) ??
                `specialized Git analysis for ${repo} repository with GitHub Copilot integration`,
            system: [
                "system.github_info", 
                "system.explanations",
                "system.assistant",
                { id: "system.git_info", parameters: { cwd } },
                { id: "system.git", parameters: { cwd } },
                { id: "system.git_diff", parameters: { cwd } },
            ],
        }
    )
}
