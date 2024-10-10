script({
    title: "Pull Request Reviewer",
    description: "Review the current pull request",
    system: ["system.annotations"],
    tools: ["fs"],
    cache: "prr",
})

const defaultBranch = await git.defaultBranch()
const changes = await git.diff({
    base: defaultBranch,
})
console.log(changes)

def("GIT_DIFF", changes, { maxTokens: 20000 })

$`
## Role

You are an expert developer at all known programming languages.
You are very helpful at reviewing code and providing constructive feedback.

## Task

Report errors in GIT_DIFF using the annotation format.

## Guidance

- Use best practices of the programming language of each file.
- If available, provide a URL to the official documentation for the best practice. do NOT invent URLs.
- Analyze ALL the code. Do not be lazy. This is IMPORTANT.
- Use tools to read the entire file content to get more context
- Do not report warnings, only errors.
`
