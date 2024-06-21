script({ system: ["system"], model: "openai:gpt-4-32k" })
// find previous tag
const { stdout: tag } = await host.exec("git", [
    "describe",
    "--tags",
    "--abbrev=0",
    "HEAD^",
])
const { stdout: commits } = await host.exec("git", ["log", `HEAD...${tag}`])
const { stdout: diff } = await host.exec("git", ["diff", `${tag}..HEAD`])

def("COMMITS", commits, { maxTokens: 4000 })
def("DIFF", diff, { maxTokens: 20000 })

$`
You are an expert software developer and release manager.

## Task

Generate a clear, exciting, relevant, useful release notes
for the upcoming release of your software. The commits in the release are in COMMITS.
The diff of the changes are in DIFF.

## Guidelines

- use emojis

`
