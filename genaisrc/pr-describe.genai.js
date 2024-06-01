script({
    model: "openai:gpt-4",
    files: [],
    title: "pr-describe",
    system: ["system"],
})
const { stdout: changes } = await host.exec("git", [
    "diff",
    "main",
    ":!**/genaiscript.d.ts",
])

def("GIT_DIFF", changes, { maxTokens: 20000 })

$`You are an expert software developer and architect.

## Task

- Summarize the changes in GIT_DIFF.
- Provide a sate diagram of the changes in GIT_DIFF using mermaid syntax.

## Instructions

- do NOT repeat the contents of GIT_DIFF
`
