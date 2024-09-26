import { Octokit } from "octokit"

const workflowFileName = "genai-azure-service-principal.yml"

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
})
const { owner, repo } = await getRepoInfo()
console.log(`Owner: ${owner}`)
console.log(`Repo: ${repo}`)

async function getRepoInfo() {
    const remoteUrl = (await host.exec("git config --get remote.origin.url"))
        .stdout
    const match = remoteUrl.match(/github\.com\/(.+)\/(.+)$/)
    if (!match) {
        throw new Error(
            "Could not parse repository information from remote URL"
        )
    }
    const [, owner, repo] = match
    return { owner, repo }
}

async function findFirstFailingWorkflowRun() {
    try {
        // Get the workflow runs for the specified workflow file, filtering for failures
        const {
            data: { workflow_runs },
        } = await octokit.rest.actions.listWorkflowRuns({
            owner,
            repo,
            workflow_id: workflowFileName,
            status: "failure",
            per_page: 100,
        })

        // Get the first failing run
        const firstFailingRun = workflow_runs[0]

        if (firstFailingRun) {
            console.log("First failing workflow run found:")
            console.log(`ID: ${firstFailingRun.id}`)
            console.log(`Name: ${firstFailingRun.name}`)
            console.log(`Conclusion: ${firstFailingRun.conclusion}`)
            console.log(`Created at: ${firstFailingRun.created_at}`)
            console.log(`URL: ${firstFailingRun.html_url}`)
            console.log(`Commit SHA: ${firstFailingRun.head_sha}`)
        } else {
            console.log("No failing workflow runs found.")
        }

        return firstFailingRun
    } catch (error) {
        console.error("Error fetching workflow runs:", error)
        return undefined
    }
}

async function downloadWorkflowRunStepsOutput(runId: number) {
    try {
        const res = []
        // Get the jobs for the specified workflow run
        const {
            data: { jobs },
        } = await octokit.rest.actions.listJobsForWorkflowRun({
            owner,
            repo,
            run_id: runId,
        })

        for (const job of jobs) {
            const logUrl =
                await octokit.rest.actions.downloadJobLogsForWorkflowRun({
                    owner,
                    repo,
                    job_id: job.id,
                })
            const { text: log } = await fetchText(logUrl.url)
            console.log(
                `> job: ${job.name} ${job.conclusion}  (${(log.length / 1e3) | 0}kb)`
            )
            const rjob = { ...job, steps: [], log }

            for (const step of job.steps) {
                console.log(`  > step: ${step.name} ${step.conclusion}`)
                const rstep = { ...step }
                rjob.steps.push(rstep)
            }
            res.push(rjob)
        }
        return res
    } catch (error) {
        console.error("Error downloading workflow run steps output:", error)
        return []
    }
}

const run = await findFirstFailingWorkflowRun()
const jobs = await downloadWorkflowRunStepsOutput(run.id)
