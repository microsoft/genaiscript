system({
    title: "Git repository information",
})

export default async function main(ctx) {
    const branch = await git.branch()
    const defaultBranch = await git.defaultBranch()

    ctx.$`git: The current branch is ${branch} and the default branch is ${defaultBranch}.`
}
