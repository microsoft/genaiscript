script({
    model: "openai:gpt-4-32k",
    files: [],
    temperature: 1,
    title: "pr-describe",
    system: ["system", "system.fs_find_files", "system.fs_read_file"],
})

const defaultBranch = env.vars.defaultBranch || (await git.defaultBranch())
const { text, error } = await runPrompt(async (_) => {
    const changes = await git.diff({
        base: defaultBranch,
        excludedPaths: [
            "**/genaiscript.d.ts",
            "**/*sconfig.json",
            "genaisrc/*",
            ".github/*",
            ".vscode/*",
            "**/yarn.lock",
            "*THIRD_PARTY_LICENSES.md",
        ],
    })

    _.def("GIT_DIFF", changes, {
        language: "diff",
        maxTokens: 20000,
    })

    _.$`You are an expert software developer and architect.

## Task

Create a pull request title and description for the changes in GIT_DIFF.

The first line of the response should be the title of the pull request, the rest should be the description.

   <title>
   <description...>

## Title Instructions

- the title should be less than 50 characters

## Description Instructions

- do NOT explain that GIT_DIFF displays changes in the codebase
- try to extract the intent of the changes, don't focus on the details
- use bullet points to list the changes
- use emojis to make the description more engaging
- focus on the most important changes
- ignore comments about imports (like added, remove, changed, etc.)
- the public API is defined in "packages/core/src/prompt_template.d.ts" and "packages/core/src/prompt_type.ts".
  Changes in those files are "user facing".
`
})

// exec output
console.log(error)
console.log(text)
