script({
    title: "Pull Request Descriptor",
    description: "Generate a pull request description from the git diff",
    tools: ["fs"],
    temperature: 0.5,
    parameters: {
        defaultBranch: {
            type: "string",
            description: "The default branch of the repository",
            default: "main",
        },
    },
})

// configuration
const defaultBranch = env.vars.defaultBranch

// context
// compute diff with the default branch
const { stdout: changes } = await host.exec("git", [
    "diff",
    defaultBranch,
    "--cached",
    "--",
    ".",
    ":!.vscode/*",
    ":!*yarn.lock",
    ":!*THIRD_PARTY_LICENSES.md",
])

def("GIT_DIFF", changes, {
    language: "diff",
    maxTokens: 20000,
})

// task
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
`

// running: make sure to add the -prd flag
