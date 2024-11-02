system({
    title: "Git repository information",
})

const branch = await git.branch()
const defaultBranch = await git.defaultBranch()

$`git: The current branch is ${branch} and the default branch is ${defaultBranch}.`
