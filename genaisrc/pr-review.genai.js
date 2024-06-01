script({
    model: "openai:gpt-4",
    files: [],
    title: "pull request review",
    system: [
        "system",
        "system.typescript",
        "system.fs_find_files",
        "system.fs_read_file",
        "system.annotations"
    ],
})
const { stdout: changes } = await host.exec("git", [
    "diff",
    "main",
    "--",
    ":!**/genaiscript.d.ts",
    ":!.vscode/*",
    ":!yarn.lock",
])

def("GIT_DIFF", changes, { maxTokens: 20000 })

$`You are an expert software developer and architect. You are
an expert in software reliability, security, scalability, and performance.

## Task

Review the changes in GIT_DIFF and provide feedback to the author using annotations.

- report errors only, ignore notes and warnings.
- use a friendly tone
- use emojis
- read the full source code of the files if you need more context
`
