/* spellchecker: disable */
import { Octokit } from "octokit"
import { createPatch, createTwoFilesPatch, diffArrays, formatPatch } from "diff"

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
})
const { owner, repo } = await getRepoInfo()

script({
    system: ["system", "system.files", "system.annotations"],
    cache: "gh-investigator",
})

const workflow = env.vars.workflow || "build.yml"
const lsid = 11025993709

const runs = await listRuns(workflow)

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
const lsjob = lsjobs[0]
const lslog = lsjob.text
console.log(
    `> last success log: ${(lslog.length / 1000) | 0}kb ${lsjob.logUrl}`
)
const ffjobs = await downloadRunLog(ff.id)
const ffjob = ffjobs[0]
const fflog = ffjob.text
console.log(
    `> first failure log: ${(fflog.length / 1000) | 0}kb  ${ffjob.logUrl}`
)

const pr = await getPullRequestForRun(ff.id)
if (pr) console.log(`> PR: ${pr.number}, ${pr.title}, ${pr.html_url}`)

const logDiff = diffJobLogs(lslog, fflog)
console.log(`> log diff: ${(logDiff.length / 1000) | 0}kb`)

const res = await runPrompt(
    (_) => {
        // include difss
        _.def("GIT_DIFF", gitDiff, {
            language: "diff",
            maxTokens: 10000,
            lineNumbers: false,
        })
        _.def("LOG_DIFF", logDiff, {
            language: "diff",
            maxTokens: 20000,
            lineNumbers: false,
        })
        _.$`Your are an expert software engineer and you are able to analyze the logs and find the root cause of the failure.

- GIT_DIFF contains a diff of 2 run commits
- LOG_DIFF contains a diff of 2 runs in GitHub Action
- The first run is the last successful run and the second run is the first failed run

## Task 1

Analyze the diff in LOG_DIFF and provide a summary of the root cause of the failure. 

If you cannot find the root cause, stop.

## Task 2

Generate updates for the source files that can fix the issue.
- use a unified diff format compatible with diff

## Task 3

Generate annotations in the source code to help identify the root cause of the failure.`
    },
    { cache: "gai" }
)

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
    const runs = workflow_runs.filter(
        ({ conclusion }) => conclusion !== "skipped"
    )
    return runs
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
        const { url: logUrl } =
            await octokit.rest.actions.downloadJobLogsForWorkflowRun({
                owner,
                repo,
                job_id: job.id,
            })
        const { text } = await fetchText(logUrl)
        res.push({ ...job, logUrl, text })
    }
    return res
}

async function getPullRequestForRun(run_id: number) {
    const { data: workflowRun } = await octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id,
    })
    if (workflowRun.event === "pull_request") {
        const url = workflowRun.pull_requests?.[0]?.url
        if (url) {
            // Fetch the pull request details
            const { data: pullRequest } = await octokit.request(
                workflowRun.pull_requests[0].url
            )
            return pullRequest
        }
    }
    return null
}

function diffJobLogs(firstLog: string, otherLog: string) {
    let firsts = parseJobLog(firstLog)
    let others = parseJobLog(otherLog)

    // assumption: the list of steps has not changed
    const n = Math.min(firsts.length, others.length)
    firsts = firsts.slice(0, n)
    others = others.slice(0, n)

    // now do a regular diff
    const f = firsts
        .map((f) =>
            f.title ? `##[group]${f.title}\n${f.text}\n##[endgroup]` : f.text
        )
        .join("\n")
    const l = others
        .map((f) =>
            f.title ? `##[group]${f.title}\n${f.text}\n##[endgroup]` : f.text
        )
        .join("\n")
    const d = createPatch("log.txt", f, l, undefined, undefined, {
        ignoreCase: true,
        ignoreWhitespace: true,
    })
    return d
}

function parseJobLog(text: string) {
    const lines = cleanLog(text).split(/\r?\n/g)
    const groups: { title: string; text: string }[] = []
    let current = groups[0]
    for (const line of lines) {
        if (line.startsWith("##[group]")) {
            current = { title: line.slice("##[group]".length), text: "" }
        } else if (line.startsWith("##[endgroup]")) {
            if (current) groups.push(current)
            current = undefined
        } else {
            if (!current) current = { title: "", text: "" }
            current.text += line + "\n"
        }
    }
    if (current) groups.push(current)

    const ignoreSteps = [
        "Runner Image",
        "Fetching the repository",
        "Checking out the ref",
        "Setting up auth",
        "Setting up auth for fetching submodules",
        "Getting Git version info",
        "Initializing the repository",
        "Determining the checkout info",
        "Persisting credentials for submodules",
    ]
    return groups.filter(({ title }) => !ignoreSteps.includes(title))
}

function cleanLog(text: string) {
    return text
        .replace(
            // timestamps
            /^﻿?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{2,}Z /gm,
            ""
        )
        .replace(/\x1b\[[0-9;]*m/g, "") // ascii colors
}
