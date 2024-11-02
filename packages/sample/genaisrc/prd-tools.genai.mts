script({
    title: "Pull Request Descriptor - Tools",
    description: "Generate a pull request description from the git diff",
    tools: ["fs", "git"],
    temperature: 0.5,
})

$`You are an expert software developer and architect.

## Task

1. Compute the code different between the current branch and the default branch in this repository.
2. Describe a high level summary of the code changes.

## Instructions

- if the diff is too large, diff each file separately
- This description will be used as the pull request description.
- talk like a software engineer
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- ignore comments about imports (like added, remove, changed, etc.)
`
