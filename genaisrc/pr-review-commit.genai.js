script({
    model: "openai:gpt-4",
    files: [],
    title: "pull request commit review",
    system: [
        "system",
        "system.typescript",
        "system.fs_find_files",
        "system.fs_read_file",
        "system.annotations",
    ],
})
const { stdout: changes } = await host.exec("git", [
    "diff",
    "HEAD^",
    "HEAD",
    "--",
    "**.ts",
])

def("GIT_DIFF", changes, { maxTokens: 20000, lineNumbers: false })

$`You are an expert software developer and architect. You are
an expert in software reliability, security, scalability, and performance.

## Task

Review the changes in GIT_DIFF which contains the changes of the last commit in the pull request branch.
Provide feedback to the author using annotations.

Think step by step and for each annotation explain your result.

- report errors only, ignore notes and warnings
- only report issues you are absolutely certain about
- use a friendly tone
- use emojis
- read the full source code of the files if you need more context
- only report issues about code in GIT_DIFF
`
