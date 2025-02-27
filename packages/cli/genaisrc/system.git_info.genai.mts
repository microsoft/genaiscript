system({
    title: "Git repository information",
    parameters: {
        cwd: {
            type: "string",
            description: "Current working directory",
        },
    },
})

export default async function (ctx: PromptContext) {
    const { env, $ } = ctx
    const { vars } = env

    const cwd = vars["system.git_info.cwd"]
    const client = cwd ? git.client(cwd) : git

    const branch = await client.branch()
    const defaultBranch = await client.defaultBranch()

    $`## Git
The current branch is ${branch} and the default branch is ${defaultBranch} ${cwd ? `in ${cwd}` : ""}.`
}
