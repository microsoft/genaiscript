script({ system: ["system"], temperature: 0.5 })

const product = env.vars.product || "GenAIScript"

// find previous tag
const { version } = await workspace.readJSON("package.json")
const tag = await git.lastTag()
const commits = await git.log({
    excludedGrep: "(skip ci|THIRD_PARTY_NOTICES|genai)",
    base: tag,
    head: "HEAD",
})
const diff = await git.diff({
    base: tag,
    head: "HEAD",
    excludedPaths: [
        "**/package.json",
        "**/genaiscript.d.ts",
        "**/jsconfig.json",
        "docs/**",
        ".github/*",
        ".vscode/*",
        "**/yarn.lock",
        "THIRD_PARTY_NOTICES.md",
    ],
})

const commitsName = def(
    "COMMITS",
    commits.map(({ message }) => message).join("\n"),
    { maxTokens: 4000 }
)
const diffName = def("DIFF", diff, { maxTokens: 20000 })

$`
You are an expert software developer and release manager.

## Task

Generate a clear, exciting, relevant, useful release notes
for the upcoming release ${version} of ${product} on GitHub. 

- The commits in the release are in ${commitsName}.
- The diff of the changes are in ${diffName}.

## Guidelines

- only include the most important changes. All changes must be in the commits.
- tell a story about the changes
- use emojis
- ignore commits with '[skip ci]' in the message
- do NOT give a commit overview
- do NOT add a top level title
- do NOT mention ignore commits or instructions
- be concise
- do not wrap text in markdown section
`
