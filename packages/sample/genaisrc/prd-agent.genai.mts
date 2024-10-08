script({
    title: "Pull Request Descriptor - Agent",
    description: "Generate a pull request description from the git diff",
    tools: ["fs", "git_diff", "git_branch_current", "git_branch_default"],
    temperature: 0.5,
})

$`You are an expert software developer and architect.

## Task

1. Compute the code difference between the current branch and the default branch in this repository (use git diff).
2. Describe a high level summary of the code changes.

## Instructions

- This description will be used as the pull request description.
- talk like a software engineer
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- ignore comments about imports (like added, remove, changed, etc.)
- do NOT add a "pull request description" header
`
