script({
    model: "openai:gpt-4-32k",
    files: [],
    temperature: 1,
    title: "pr-describe",
    system: ["system", "system.fs_find_files", "system.fs_read_file"],
})

const defaultBranch = env.vars.defaultBranch || "main"
const { stdout: changes } = await host.exec("git", [
    "diff",
    defaultBranch,
    "--",
    ":!**/genaiscript.d.ts",
    ":!**/jsconfig.json",
    ":!genaisrc/*",
    ":!.github/*",
    ":!.vscode/*",
    ":!yarn.lock",
    ":!THIRD_PARTY_LICENSES.md",
])

def("GIT_DIFF", changes, {
    language: "diff",
    maxTokens: 20000,
})

$`You are an expert software developer and architect.

## Task

- Describe a high level summary of the changes in GIT_DIFF in a way that a software engineer will understand.

## Instructions

- do NOT explain that GIT_DIFF displays changes in the codebase
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- ignore comments about imports (like added, remove, changed, etc.)
- the public API is defined in "packages/core/src/prompt_template.d.ts" and "packages/core/src/prompt_type.ts".
  Changes in those files are "user facing".

`
