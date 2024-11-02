script({
    title: "Pull Request Descriptor",
    description: "Generate a pull request description from the git diff",
    temperature: 0.5,
    system: [
        "system",
        "system.assistant",
        "system.safety_harmful_content",
        "system.safety_protected_material",
    ],
})

const defaultBranch = await git.defaultBranch()
const branch = await git.branch()
if (branch === defaultBranch) cancel("you are already on the default branch")

// compute diff
const changes = await git.diff({
    base: defaultBranch,
})
console.log(changes)

// task
$`## Task

Describe a high level summary of the changes in GIT_DIFF in a way that a software engineer will understand.
This description will be used as the pull request description.

## Instructions

- do NOT explain that GIT_DIFF displays changes in the codebase
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- ignore comments about imports (like added, remove, changed, etc.)
`

def("GIT_DIFF", changes, { maxTokens: 30000 })
