system({
    title: "git worktree operations",
    description: "Tools to manage git worktrees.",
    parameters: {
        cwd: {
            type: "string",
            description: "Current working directory",
            required: false,
        },
    },
})

export default function (ctx: ChatGenerationContext) {
    const { env, defTool } = ctx
    const { vars } = env
    const cwd = vars["system.git_worktree.cwd"]
    const client = cwd ? git.client(cwd) : git

    defTool(
        "git_worktree_list",
        "List all worktrees in the repository.",
        {},
        async (args) => {
            const { context } = args
            const worktrees = await client.worktreeList()
            const result = worktrees.map(wt => {
                const parts = [`${wt.path} (${wt.head})`]
                if (wt.branch) parts.push(`branch: ${wt.branch}`)
                if (wt.bare) parts.push("bare")
                if (wt.detached) parts.push("detached")
                return parts.join(", ")
            }).join("\n")
            context.debug(result)
            return result
        }
    )

    defTool(
        "git_worktree_add",
        "Add a new worktree.",
        {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Path where the new worktree will be created",
                },
                commitish: {
                    type: "string",
                    description: "Optional commit, branch, or tag to checkout in the new worktree",
                },
                copyEnv: {
                    type: "boolean",
                    description: "Copy .env files from source directory to new worktree",
                    default: false,
                },
                setupSteps: {
                    type: "boolean",
                    description: "Run setup steps (e.g., npm install) in the new worktree",
                    default: false,
                },
            },
            required: ["path"],
        },
        async (args) => {
            const { context, path, commitish, copyEnv, setupSteps } = args
            const result = await client.worktreeAdd(path, commitish, {
                copyEnv,
                setupSteps,
            })
            context.debug(result)
            return result
        }
    )

    defTool(
        "git_worktree_remove",
        "Remove a worktree.",
        {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Path of the worktree to remove",
                },
                force: {
                    type: "boolean",
                    description: "Force removal even if worktree is dirty",
                    default: false,
                },
            },
            required: ["path"],
        },
        async (args) => {
            const { context, path, force } = args
            const result = await client.worktreeRemove(path, force)
            context.debug(result)
            return result
        }
    )

    defTool(
        "git_worktree_prune",
        "Prune worktree information for removed worktrees.",
        {},
        async (args) => {
            const { context } = args
            const result = await client.worktreePrune()
            context.debug(result)
            return result
        }
    )
}