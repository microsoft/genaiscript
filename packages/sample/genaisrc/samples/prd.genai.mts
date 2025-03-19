script({
    title: "Pull Request Descriptor",
    description: "Generate a pull request description from the git diff",
    temperature: 0.5,
    systemSafety: true,
})
const { safety } = env.vars

const defaultBranch = await git.defaultBranch()
const branch = await git.branch()
if (branch === defaultBranch) cancel("you are already on the default branch")

// compute diff
const changes = await git.diff({
    base: defaultBranch,
})
console.log(changes)

def("GIT_DIFF", changes, {
    maxTokens: 14000,
    detectPromptInjection: "available",
})

// task
$`## Task

You are an expert code reviewer with great English technical writing skills.

Your task is to generate a high level summary of the changes in <GIT_DIFF> for a pull request in a way that a software engineer will understand.
This description will be used as the pull request description.

## Instructions

- do NOT explain that GIT_DIFF displays changes in the codebase
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- do not try to fix issues, only describe the changes
- ignore comments about imports (like added, remove, changed, etc.)
`
