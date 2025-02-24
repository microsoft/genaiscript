system({
    title: "Git repository information",
    parameters: {
        cwd: {
            type: "string",
            description: "Current working directory",
        },
    },
})
console.log({ vars: env.vars })

const cwd = env.vars["system.git_info.cwd"]
const client = cwd ? git.client(cwd) : git

const branch = await client.branch()
const defaultBranch = await client.defaultBranch()

$`## Git
The current branch is ${branch} and the default branch is ${defaultBranch} ${cwd ? `in ${cwd}` : ""}.`
