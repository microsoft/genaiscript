script({
    files: [],
    title: "pull request review",
    system: ["system", "system.typescript"],
    tools: ["fs"],
})

const defaultBranch = env.vars.defaultBranch || (await git.defaultBranch())
const diff = await git.diff({
    base: defaultBranch,
    paths: ["**.ts"],
    excludedPaths: [
        "**/genaiscript.d.ts",
        "**/jsconfig.json",
        "genaisrc/*",
        ".github/*",
        ".vscode/*",
        "**/yarn.lock",
        "*THIRD_PARTY_LICENSES.md",
    ],
})

def("GIT_DIFF", diff, {
    language: "diff",
    maxTokens: 20000,
})

$`You are an expert software developer and architect. You are
an expert in software reliability, security, scalability, and performance.

## Task

GIT_DIFF contains the changes the pull request branch.

Analyze the changes in GIT_DIFF in your mind.

If the changes look good, respond "LGTM :rocket:". If you have any concerns, provide a brief description of the concerns.

- All the TypeScript files are compiled and type-checked by the TypeScript compiler. Do not report issues that the TypeScript compiler would find.
- only report functional issues
- Use emojis
- If available, suggest code fixes and improvements using a diff format.
- do not report about individual lines of code, summarize changes
`

import type { Octokit } from "@octokit/rest"
script({ model: "echo" })
const { dbg } = env
const { owner, repo } = await github.info()
dbg(`owner: ${owner}, repo: ${repo}`)
const pr = await github.getPullRequest(1414)
dbg(`pr: ${pr?.number || "?"}`)
dbg(`approving ${owner}/${repo}#${pr.number}`)
const api: Octokit = (await github.api()).client
dbg(`api: %O`, api.pulls)
await api.pulls.createReview({
    owner,
    repo,
    pull_number: pr.number,
    event: "APPROVE",
    body: "Looks good to me! 🚀",
})
dbg("approved")
