script({
    model: "openai:gpt-4",
    files: [],
    title: "pr-describe",
    system: ["system", "system.fs_find_files", "system.fs_read_file"],
})
const { stdout: changes } = await host.exec("git", [
    "diff",
    "origin/main",
    "--",
    ":!**/genaiscript.d.ts",
])

def("GIT_DIFF", changes, { maxTokens: 20000 })

$`You are an expert software developer and architect.

## Task

- Describe the changes in GIT_DIFF in a way that a software engineer will understand.

## Instructions

- use emojis to make the description more engaging
- if needed inline code snippets can be used. The code snippets should be taken
from the changes in GIT_DIFF.

`
