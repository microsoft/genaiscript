script({ system: ["system"], temperature: 0.5, model: "openai:gpt-4-turbo" })

const product = env.vars.product || "GenAIScript"

// find previous tag
const pkg = await workspace.readJSON("package.json")
const { version } = pkg
const { stdout: tag } = await host.exec("git", [
    "describe",
    "--tags",
    "--abbrev=0",
    "HEAD^",
])
const { stdout: commits } = await host.exec("git", [
    "log",
    "--grep='(skip ci|THIRD_PARTY_NOTICES)'",
    "--invert-grep",
    "--no-merges",
    `HEAD...${tag}`,
])
const { stdout: diff } = await host.exec("git", [
    "diff",
    `${tag}..HEAD`,
    "--no-merges",
    "--",
    ":!**/package.json",
    ":!**/genaiscript.d.ts",
    ":!**/jsconfig.json",
    ":!docs/**",
    ":!.github/*",
    ":!.vscode/*",
    ":!*yarn.lock",
    ":!*THIRD_PARTY_NOTICES.md",
])

const commitsName = def("COMMITS", commits, { maxTokens: 4000 })
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

`
