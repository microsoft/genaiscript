script({
    title: "GitHub Action Investigator",
    description:
        "Analyze GitHub Action runs to find the root cause of a failure",
    parameters: {
        workflow: { type: "string" }, // Workflow name
        failure_run_id: { type: "number" }, // ID of the failed run
        success_run_id: { type: "number" }, // ID of the successful run
        branch: { type: "string" }, // Branch name
    },
    system: [
        "system",
        "system.assistant",
        "system.annotations",
        "system.files",
    ],
    flexTokens: 30000,
    cache: "gai",
    tools: ["fs_read_file", "agent_github", "agent_git"],
})
const { output } = env

output.heading(2, "Investigator report")

// Assign the 'workflow' parameter from environment variables
let workflow = env.vars.workflow

// If no workflow provided, select from available workflows
if (!workflow) {
    const workflows = await github.listWorkflows()
    workflow = await host.select(
        "Select a workflow",
        workflows.map(({ path, name }) => ({ value: path, name }))
    )
    if (!workflow) cancel("No workflow selected")
}

// Assign failure and success run IDs from environment variables
const failureRunId = env.vars.failure_run_id
const lastSuccessRunId = env.vars.success_run_id

// Retrieve repository information
const { owner, repo, refName } = await github.info()

// Assign branch name, defaulting to current reference name if not provided
let branch = env.vars.branch || refName

// If no branch provided, select from available branches
if (!branch) {
    const branches = await github.listBranches()
    branch = await host.select("Select a branch", branches)
    if (!branch) cancel("No branch selected")
}

// List workflow runs for the specified workflow and branch
const runs = await github.listWorkflowRuns(workflow, { branch })
if (!runs.length) cancel("No runs found")

// Find the index of the failed run using the provided or default criteria
let firstFailureIndex = failureRunId
    ? runs.findIndex(({ id }) => id === failureRunId)
    : runs.findIndex(({ conclusion }) => conclusion === "failure")

// Default to the first run if no failed run is found
if (firstFailureIndex < 0) firstFailureIndex = 0
const firstFailureRun = runs[firstFailureIndex]
output.heading(3, "First failed run")
output.item(firstFailureRun.display_title)
output.itemLink(`run report`, firstFailureRun.html_url)

// Find the index of the last successful run before the failure
const runsAfterFailure = runs.slice(firstFailureIndex)
const lastSuccessRunIndex = lastSuccessRunId
    ? runs.findIndex(({ id }) => id === lastSuccessRunId)
    : runsAfterFailure.findIndex(({ conclusion }) => conclusion === "success")

const lastSuccessRun = runsAfterFailure[lastSuccessRunIndex]
if (lastSuccessRun) {
    if (lastSuccessRun.head_sha === firstFailureRun.head_sha) {
        console.debug("No previous successful run found")
    } else {
        output.heading(3, "Last successful run")
        output.item(lastSuccessRun.display_title)
        output.itemLink(`run report`, lastSuccessRun.html_url)
        output.itemLink(
            `head ${firstFailureRun.head_sha.slice(0, 7)}`,
            firstFailureRun.html_url
        )
        output.itemLink(
            `diff ${lastSuccessRun.head_sha.slice(0, 7)}...${firstFailureRun.head_sha.slice(0, 7)}`,
            `https://github.com/${owner}/${repo}/compare/${lastSuccessRun.head_sha}...${firstFailureRun.head_sha})`
        )

        // Execute git diff between the last success and failed run commits
        const gitDiff = await git.diff({
            base: lastSuccessRun.head_sha,
            head: firstFailureRun.head_sha,
            excludedPaths: "**/genaiscript.d.ts",
        })
        if (gitDiff)
            def("GIT_DIFF", gitDiff, {
                language: "diff",
                lineNumbers: true,
                flex: 1,
            })
    }
}

// Download logs of the failed job
const firstFailureJobs = await github.listWorkflowJobs(firstFailureRun.id)
const firstFailureJob =
    firstFailureJobs.find(({ conclusion }) => conclusion === "failure") ??
    firstFailureJobs[0]
const firstFailureLog = firstFailureJob.content
if (!firstFailureLog) cancel("No logs found")

if (!lastSuccessRun) {
    // Define log content if no last successful run is available
    def("LOG", firstFailureLog, { maxTokens: 20000, lineNumbers: false })
} else {
    const lastSuccessJobs = await github.listWorkflowJobs(lastSuccessRun.id)
    const lastSuccessJob = lastSuccessJobs.find(
        ({ name }) => firstFailureJob.name === name
    )
    if (!lastSuccessJob)
        console.debug(
            `could not find job ${firstFailureJob.name} in last success run`
        )
    else {
        const lastSuccessLog = lastSuccessJob.content
        // Generate a diff of logs between the last success and failed runs
        defDiff("LOG_DIFF", lastSuccessLog, firstFailureLog, {
            lineNumbers: false,
            flex: 4,
        })
    }
}

// Instruction for generating a report based on the analysis
$`Your are an expert software engineer and you are able to analyze the logs and find the root cause of the failure.

${lastSuccessRun ? "- GIT_DIFF contains a diff of 2 run commits" : ""}
${lastSuccessRun ? "- LOG_DIFF contains a diff of 2 runs in GitHub Action" : "- LOG contains the log of the failed run"}
- The first run is the last successful run and the second run is the first failed run

Add links to run logs.

Analyze the diff in LOG_DIFF and provide a summary of the root cause of the failure. Show the code that is responsible for the failure.

If you cannot find the root cause, stop.

Generate a diff with suggested fixes. Use a diff format.
- If you cannot locate the error, do not generate a diff.

Report suggested fixes in the annotation format.
`
