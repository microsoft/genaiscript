import type { Octokit } from "@octokit/rest"
const { dbg } = env
const { owner, repo } = await github.info()
const pr = await github.getPullRequest()
const api: Octokit = await github.api()

dbg(`approving ${owner}/${repo}#${pr.number}`)
await api.pulls.createReview({
    owner,
    repo,
    pull_number: pr.number,
    event: "APPROVE",
    body: "Looks good to me! 🚀",
})
