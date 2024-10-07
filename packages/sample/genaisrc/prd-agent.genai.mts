script({
    title: "Pull Request Descriptor - Agent",
    description: "Generate a pull request description from the git diff",
    tools: ["agent-ts", "agent-diff"],
    temperature: 0.5,
})

$`You are an expert software developer and architect.

## Task

Describe a high level summary of the code changes in the current branch with a default branch in a way that a software engineer will understand.
This description will be used as the pull request description.

## Instructions

- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- ignore comments about imports (like added, remove, changed, etc.)
`
