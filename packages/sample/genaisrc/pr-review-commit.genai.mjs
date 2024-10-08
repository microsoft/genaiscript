script({
    model: "openai:gpt-4-32k",
    temperature: 0,
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

const commit = env.vars.commit || "HEAD"

// diff latest commit
const changes = await git.diff({
    head: commit,
    paths: ["**.ts"],
})
def("GIT_DIFF", changes, { language: "diff", maxTokens: 20000 })

$`You are an expert TypeScript software developer and architect. You are
an expert in software reliability, security, scalability, and performance.

## Task

Review the changes in GIT_DIFF which contains the diff of the last commit in the pull request branch using the TypeScript language.
Provide feedback to the author using annotations.

Think step by step and for each annotation explain your result.

## Guidelines

- Assume the TypeScript code is type correct, the compiler found all the syntax errors. 
- do NOT report issues that the TypeScript type checker would find.
- report 3 most serious errors only, ignore notes and warnings
- only report issues you are absolutely certain about
- do NOT repeat the same issue multiple times
- do NOT report common convention issues
- do NOT report deleted code since you cannot review the entire codebase
- do NOT report deleted imports
- do NOT report missing types
- use a friendly tone
- use emojis
- do NOT cross-reference annotations, assume they are all independent
- read the full source code of the files if you need more context
- only report issues about code in GIT_DIFF
- do NOT report issues for the following codes: missing_coma, missing_comment, missing_blank_line, missing_dependency, missing_error_handling
- do NOT report issues for the following codes: missing_coma, missing_comment, missing_blank_line, missing_dependency, missing_error_handling
`
