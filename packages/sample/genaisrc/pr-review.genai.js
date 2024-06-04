script({
    model: "openai:gpt-4",
    files: [],
    title: "pull request review",
    system: [
        "system",
        "system.typescript",
        "system.fs_find_files",
        "system.fs_read_file",
    ],
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

def("GIT_DIFF", changes, { language: "diff", maxTokens: 20000, lineNumbers: false })

$`You are an expert software developer and architect. You are
an expert in software reliability, security, scalability, and performance.

## Task

GIT_DIFF contains the changes the pull request branch.

Provide a high level review of the changes in the pull request. Do not enter into details.

If the changes look good, respond "LGTM :rocket:". If you have any concerns, provide a brief description of the concerns.

- All the TypeScript files are compiled and type-checked by the TypeScript compiler. Do not report issues that the TypeScript compiler would find.
- only report functional issues
- Use emojis
- If available, suggest code fixes and improvements

`
