script({
    title: "Pull Request Reviewer",
    description: "Review the current pull request",
    system: [
        "system.assistant",
        "system.annotations",
        "system.safety_jailbreak",
        "system.safety_harmful_content",
        "system.safety_validate_harmful_content",
    ],
    tools: ["agent_fs", "agent_git"],
    parameters: {
        base: {
            type: "string",
            description: "The base branch of the pull request",
        },
    },
})

const base = env.vars.base || (await git.defaultBranch())
const changes = await git.diff({
    base,
})
console.log(changes)
def("GIT_DIFF", changes, {
    maxTokens: 14000,
    detectPromptInjection: "available",
})

$`Report errors in <GIT_DIFF> using the annotation format.

- Use best practices of the programming language of each file.
- If available, provide a URL to the official documentation for the best practice. do NOT invent URLs.
- Analyze ALL the code. Do not be lazy. This is IMPORTANT.
- Use tools to read the entire file content to get more context
- Do not report warnings, only errors.
`
