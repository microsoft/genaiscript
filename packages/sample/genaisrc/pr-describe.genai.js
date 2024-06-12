script({
    model: "openai:gpt-4-32k",
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

def("GIT_DIFF", changes, {
    language: "diff",
    maxTokens: 20000,
})

$`You are an expert software developer and architect.

## Task

- Describe a high level summary of the changes in GIT_DIFF in a way that a software engineer will understand.

## Instructions

- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- ignore comments about imports (like added, remove, changed, etc.)

`
