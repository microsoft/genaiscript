script({
    model: "openai:gpt-4",
    files: [],
    title: "pull request docs review",
    system: ["system", "system.technical", "system.annotations"],
    tools: ["fs_find_files", "fs_read_file"],
})

const { stdout: diff } = await host.exec("git", [
    "diff",
    "main",
    "--",
    "docs/**.md",
    "docs/**.mdx",
])

def("GIT_DIFF", diff, {
    language: "diff",
    maxTokens: 20000,
    lineNumbers: false,
})

$`You are an expert technical documentation writer.

GIT_DIFF contains the changes the current branch.
Analyze the changes in GIT_DIFF in your mind and provide feedback on the documentation.

- ignore all whitespace issues
- ignore code in .mdx files
- ignore '...' ellipsis errors in code snippets. This placeholder is perfectly acceptable in code snippets.
`
