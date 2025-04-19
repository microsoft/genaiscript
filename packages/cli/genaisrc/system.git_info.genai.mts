system({
    title: "Git repository information",
    parameters: {
        cwd: {
            type: "string",
            description: "Current working directory",
        },
    },
})

export default async function (ctx: ChatGenerationContext) {
    const { env, $ } = ctx
    const { vars } = env

    const cwd = vars["system.git_info.cwd"]
    const client = cwd ? git.client(cwd) : git

    const branch = await client.branch()
    const defaultBranch = await client.defaultBranch()

    $`## Git`
    if (branch) $`The current branch is ${branch}.`
    if (defaultBranch) $`The default branch is ${defaultBranch}.`
    if (cwd) $`The git repository is located at ${cwd}.`
}
