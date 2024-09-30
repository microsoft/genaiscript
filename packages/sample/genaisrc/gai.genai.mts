/* spellchecker: disable */

// Script for analyzing GitHub Action runs to determine the cause of a failure.
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
    system: ["system", "system.files"],
    flexTokens: 30000,
    cache: "gai",
})

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
const ffid = env.vars.failure_run_id
const lsid = env.vars.success_run_id

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
let ffi = ffid
    ? runs.findIndex(({ id }) => id === ffid)
    : runs.findIndex(({ conclusion }) => conclusion === "failure")

// Default to the first run if no failed run is found
if (ffi < 0) ffi = 0
const ff = runs[ffi]

// Log details of the failed run
console.log(`  run: ${ff.display_title}, ${ff.html_url}`)

// Find the index of the last successful run before the failure
const runsAfterFailure = runs.slice(ffi)
const lsi = lsid
    ? runs.findIndex(({ id }) => id === lsid)
    : runsAfterFailure.findIndex(({ conclusion }) => conclusion === "success")

const ls = runsAfterFailure[lsi]
if (ls) {
    // Log details of the last successful run
    console.log(`  last success: ${ls.display_title}, ${ls.html_url}`)

    // Execute git diff between the last success and failed run commits
    const gitDiff = await host.exec(
        `git diff ${ls.head_sha} ${ff.head_sha} -- . :!**/genaiscript.d.ts`
    )
    def("GIT_DIFF", gitDiff, {
        language: "diff",
        lineNumbers: true,
        flex: 1,
    })
}

// Download logs of the failed job
const ffjobs = await github.listWorkflowJobs(ff.id)
const ffjob =
    ffjobs.find(({ conclusion }) => conclusion === "failure") ?? ffjobs[0]
const fflog = ffjob.content
if (!fflog) cancel("No logs found")

if (!ls) {
    // Define log content if no last successful run is available
    def("LOG", fflog, { maxTokens: 20000, lineNumbers: false })
} else {
    const lsjobs = await github.listWorkflowJobs(ls.id)
    const lsjob = lsjobs.find(({ name }) => ffjob.name === name)
    if (!lsjob)
        console.log(`could not find job ${ffjob.name} in last success run`)
    else {
        const lslog = lsjob.content
        // Generate a diff of logs between the last success and failed runs
        defDiff("LOG_DIFF", lslog, fflog, {
            lineNumbers: false,
            flex: 4,
        })
    }
}

// Instruction for generating a report based on the analysis
$`Your are an expert software engineer and you are able to analyze the logs and find the root cause of the failure.

${ls ? "- GIT_DIFF contains a diff of 2 run commits" : ""}
${ls ? "- LOG_DIFF contains a diff of 2 runs in GitHub Action" : "- LOG contains the log of the failed run"}
- The first run is the last successful run and the second run is the first failed run

Add links to run logs.

Analyze the diff in LOG_DIFF and provide a summary of the root cause of the failure. Show the code that is responsible for the failure.

If you cannot find the root cause, stop.

Generate a diff with suggested fixes. Use a diff format.
- If you cannot locate the error, do not generate a diff.`

// Write the investigator report
writeText(
    `## Investigator report
- [run failure](${ff.html_url})
${ls ? `, [run last success](${ls.html_url})` : ""}
, [${ff.head_sha.slice(0, 7)}](${ff.html_url})
${ls ? `, [diff ${ls.head_sha.slice(0, 7)}...${ff.head_sha.slice(0, 7)}](https://github.com/${owner}/${repo}/compare/${ls.head_sha}...${ff.head_sha})` : ""}

`,
    { assistant: true }
)
