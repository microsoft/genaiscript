import { Octokit } from "octokit"
import { createTwoFilesPatch } from "diff"

const workflow = env.vars.workflow || "genai-commander.yml"

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
})
const { owner, repo } = await getRepoInfo()
console.log(`repo: ${repo}/${owner}`)

const runs = await listRuns(workflow)
console.log(
    `runs: ${runs.length}, ${runs.filter(({ conclusion }) => conclusion === "success").length} success, ${runs.filter(({ conclusion }) => conclusion === "failure").length} failure`
)
runs.forEach(({ id, conclusion }) => console.log(`> run: ${id} ${conclusion}`))

// first first failure, last success
const lsi = runs.indexOf(
    runs.find(({ conclusion }) => conclusion === "success")
)
const ls = runs[lsi - 1]
console.log(`> last success: ${ls.id}, ${ls.created_at}, ${ls.html_url}`)
const ff = runs[lsi - 1]
console.log(`> first failure: ${ff.id}, ${ff.created_at}, ${ff.html_url}`)

// download logs
const { text: lslog } = await downloadRunLog(ls.id)
const { text: fflog } = await downloadRunLog(ff.id)

// include difss
def(
    "LOG_DIFF",
    createTwoFilesPatch(
        "last-success.txt",
        lslog,
        "first-failure.txt",
        fflog,
        undefined,
        undefined,
        { ignoreCase: true, ignoreWhitespace: true, newlineIsToken: false }
    )
)
$`Your are an expert software engineer and you are able to analyze the logs and find the root cause of the failure.

Analyze the diff in LOG_DIFF and provide a summary of the root cause of the failure. 

- LOG_DIFF contains a diff of 2 runs in GitHub Actions for the ${owner}/${repo} repository. 
- The first run is the last successful run and the second run is the first failed run.
`

/*-----------------------------------------

GitHub infra

-----------------------------------------*/

async function getRepoInfo() {
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
    const res = { jobs: [], text: "" }
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
        res.jobs.push({ ...job, text })
        res.text += text + "\n"
    }
    return res
}
