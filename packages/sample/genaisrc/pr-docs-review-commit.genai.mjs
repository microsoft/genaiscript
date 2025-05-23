script({
    model: "large",
    files: [],
    temperature: 0,
    title: "pull request docs review",
    system: ["system", "system.technical", "system.annotations"],
    tools: ["fs_find_files", "fs_read_file"],
    parameters: {
        defaultBranch: {
            type: "string",
            description: "The default branch to compare against.",
        },
    },
})

const defaultBranch = env.vars.defaultBranch || (await git.defaultBranch())
console.log(`default branch: ${defaultBranch}`)
const diff = await git.diff({
    base: defaultBranch,
    paths: ["docs/**.md", "docs/**.mdx"],
})
if (!diff) cancel("No changes in docs")
const settings = await workspace.readJSON(".vscode/settings.json")

def("GIT_DIFF", diff, {
    language: "diff",
    maxTokens: 20000,
})

$`You are an expert technical documentation writer.

GIT_DIFF contains the changes the current branch.
Analyze the changes in GIT_DIFF in your mind and provide feedback on the style of the documentation.

- the content is Markdown or MDX to be rendered with Astro Starlight https://starlight.astro.build/
- ignore all whitespace issues
- ignore code and imports in .mdx files
- ignore '...' ellipsis errors in code snippets. This placeholder is perfectly acceptable in code snippets.
- ignore capitalization errors
- read the full source code of the files if you need more context
- if your confidence in the feedback is low, ignore the feedback
- only report major issues
- ignore these words: ${settings["cSpell.words"].join(", ")}
`
