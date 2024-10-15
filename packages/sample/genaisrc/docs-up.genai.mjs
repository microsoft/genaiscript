script({
    title: "Pull Request Descriptor",
    description: "Generate a pull request description from the git diff",
    temperature: 0.5,
    tools: ["agent"],
    system: [
        "system",
        "system.changelog",
        "system.safety_harmful_content",
        "system.safety_protected_material",
    ],
})

const defaultBranch = await git.defaultBranch()
const branch = await git.branch()
if (branch === defaultBranch) cancel("you are already on the default branch")

// compute diff
const changes = await git.diff({
    base: defaultBranch,
    excludedPaths: "**/system.mdx",
})
console.log(changes)

// task
$`You are an expert software developer and architect.

## Task

Analyze the changes in the codebase described in GIT_DIFF and update the documentation accordingly.
Generate file updates with the suggested changes using changelog.

`

def("GIT_DIFF", changes, { maxTokens: 30000 })
