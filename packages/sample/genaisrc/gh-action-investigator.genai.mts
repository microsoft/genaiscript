import { Octokit } from "octokit"
import { createTwoFilesPatch } from "diff"

script({
    system: ["system", "system.files"],
    cache: "gh-investigator",
})

const workflow = env.vars.workflow || "build.yml"
const lsid = 11025993709

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
})
const { owner, repo } = await getRepoInfo()
console.log(`repo: ${repo}/${owner}`)

const runs = await listRuns(workflow)
console.log(
    `runs: ${runs.length}, ${runs.filter(({ conclusion }) => conclusion === "success").length} success, ${runs.filter(({ conclusion }) => conclusion === "failure").length} failure`
)

// first first failure, last success
const lsi = lsid
    ? runs.findIndex(({ id }) => id === lsid)
    : runs.findIndex(({ conclusion }) => conclusion === "success")
const ls = runs[lsi]
console.log(
    `> last success: ${ls.id}, ${ls.created_at}, ${ls.head_sha}, ${ls.html_url}`
)
const ff = runs[lsi - 1]
console.log(
    `> first failure: ${ff.id}, ${ff.created_at}, ${ff.head_sha}, ${ff.html_url}`
)

const gitDiff = await host.exec(
    `git diff ${ls.head_sha} ${ff.head_sha} -- . :!**/genaiscript.d.ts`
)
console.log(`> source diff: ${(gitDiff.stdout.length / 1000) | 0}kb`)

// download logs
const lsjobs = await downloadRunLog(ls.id)
const lslog = lsjobs[0].text
console.log(
    `> last success log: ${(lslog.length / 1000) | 0}kb ${lslog.logUrl}`
)
const ffjobs = await downloadRunLog(ff.id)
const fflog = ffjobs[0].text
console.log(
    `> first failure log: ${(fflog.length / 1000) | 0}kb  ${fflog.logUrl}`
)

const logDiff = createTwoFilesPatch(
    "last-success.txt",
    lslog,
    "first-failure.txt",
    fflog,
    undefined,
    undefined,
    { ignoreCase: true, ignoreWhitespace: true, newlineIsToken: false }
)
console.log(`> failure diff: ${(logDiff.length / 1000) | 0}kb`)

// include difss
def("GIT_DIFF", gitDiff, {
    language: "diff",
    maxTokens: 10000,
})
def("LOG_DIFF", logDiff, { language: "diff", maxTokens: 20000 })
$`Your are an expert software engineer and you are able to analyze the logs and find the root cause of the failure.

- GIT_DIFF contains a diff of 2 run commits
- LOG_DIFF contains a diff of 2 runs in GitHub Actions for the ${owner}/${repo} repository
- The first run is the last successful run and the second run is the first failed run

## Task 1

Analyze the diff in LOG_DIFF and provide a summary of the root cause of the failure. 

If you cannot find the root cause, stop.

## Task 2

Generate updates for the source files that can fix the issue.
- use a unified diff format compatible with diff

`

/*-----------------------------------------

GitHub infra

-----------------------------------------*/

async function getRepoInfo() {
    const repository = process.env.GITHUB_REPOSITORY
    if (repository) {
        const [owner, repo] = repository.split("/")
        return { owner, repo }
    }
    const remoteUrl = (await host.exec("git config --get remote.origin.url"))
        .stdout
    const match = remoteUrl.match(/github\.com\/(?<owner>.+)\/(?<repo>.+)$/)
    if (!match) {
        throw new Error(
            "Could not parse repository information from remote URL"
        )
    }
    const { owner, repo } = match.groups
    return { owner, repo }
}

async function listRuns(workflow_id: string) {
    // Get the workflow runs for the specified workflow file, filtering for failures
    const {
        data: { workflow_runs },
    } = await octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id,
        per_page: 100,
    })
    return workflow_runs.filter(({ conclusion }) => conclusion !== "skipped")
}

async function downloadRunLog(run_id: number) {
    const res = []
    // Get the jobs for the specified workflow run
    const {
        data: { jobs },
    } = await octokit.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id,
    })
    for (const job of jobs) {
        const logUrl = await octokit.rest.actions.downloadJobLogsForWorkflowRun(
            {
                owner,
                repo,
                job_id: job.id,
            }
        )
        const { text } = await fetchText(logUrl.url)
        // remove times
        const cleaned = text.replace(
            /^﻿?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{2,}Z /gm,
            ""
        )
        res.push({ ...job, logUrl, text: cleaned })
    }
    return res
}
