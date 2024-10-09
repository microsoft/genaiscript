script({
    title: "Pull Request Descriptor - Agent",
    description: "Generate a pull request description from the git diff",
    tools: ["agent_fs", "agent_git"],
    temperature: 0.5,
})

$`Generate a pull request description for the current branch.
`
