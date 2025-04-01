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
