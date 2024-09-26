import { Octokit } from "octokit"

const workflowFileName = "genai-azure-service-principal.yml"

const octokit = new Octokit()
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

async function findFirstFailingWorkflowRun(): Promise<void> {
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
    } catch (error) {
        console.error("Error fetching workflow runs:", error)
    }
}

await findFirstFailingWorkflowRun()
