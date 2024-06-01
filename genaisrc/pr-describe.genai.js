script({
    model: "openai:gpt-4",
    files: [],
    title: "pr-describe",
    system: ["system", "system.fs_find_files", "system.fs_read_file"],
})
const { stdout: changes } = await host.exec("git", [
    "diff",
    "main",
    "--",
    ":!**/genaiscript.d.ts",
    ":!genaisrc/*",
    ":!.github/*",
    ":!.vscode/*",
    ":!yarn.lock",
])

def("GIT_DIFF", changes, { maxTokens: 20000 })

$`You are an expert software developer and architect.

## Task

- Describe a summary of the changes in GIT_DIFF in a way that a software engineer will understand.

## Instructions

- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- if needed inline code snippets can be used. The code snippets should be taken
from the changes in GIT_DIFF.

`
