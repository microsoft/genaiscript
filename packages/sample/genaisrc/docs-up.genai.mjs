script({
    title: "Pull Request Descriptor",
    description: "Generate a pull request description from the git diff",
    temperature: 0.5,
    tools: ["fs", "md"],
    system: ["system", "system.files"],
    cache: "docs-up"
})

const tip = env.vars.tip
const defaultBranch = await git.defaultBranch()
const branch = await git.branch()
if (branch === defaultBranch) cancel("you are already on the default branch")

// compute diff
const changes = await git.diff({
    base: defaultBranch,
    paths: [
        "**/prompt_template.d.ts",
        "**/prompt_type.d.ts",
        "packages/sample/**",
    ],
})
console.log(changes)

// task
$`You are an expert software developer and architect.

## Task

- Analyze and summarize the changes in the codebase described in GIT_DIFF in your own dialog and extract a list of impacted public APIs.
- Find the list of related documentation pages of those APIs that need to be updated.
- Update the documentation markdown files according to the changes.

## Guidance

${tip || ""}
- the documentation markdown is located under docs/src/content/docs/**/*.md*
- do NOT try to call tools within the agents
- do NOT create new documentation pages
`

def("GIT_DIFF", changes, { maxTokens: 30000 })
defFileOutput(
    "docs/src/content/docs/**/*.md*",
    "Updated documentation markdown pages"
)
