script({
    title: "GitHub Action Investigator",
    description:
        "Analyze GitHub Action runs to find the root cause of a failure",
    parameters: {
        /** the user can get the url from the github web
         *  like 14890513008 or https://github.com/microsoft/genaiscript/actions/runs/14890513008
         */
        runId: {
            type: "number",
            description: "Run identifier",
        },
        jobId: {
            type: "number",
            description: "Job identifier",
        },
        runUrl: {
            type: "string",
            description: "Run identifier or URL",
        },
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
const { dbg, output, vars } = env

output.heading(2, "Investigator report")
output.heading(3, "Context collection")
const { owner, repo } = await github.info()

let runId: number = vars.runId
let jobId: number = vars.jobId
if (isNaN(runId)) {
    const runUrl = vars.runUrl
    output.itemLink(`run url`, runUrl)

    // Retrieve repository information
    const { runRepo, runOwner, runIdUrl, jobIdUrl } =
        /^https:\/\/github\.com\/(?<runOwner>\w+)\/(?<runRepo>\w+)\/actions\/runs\/(?<runIdUrl>\d+)?(\/job\/(?<jobIdRun>\d+))?/i.exec(
            runUrl
        )?.groups || {}
    if (!runRepo)
        throw new Error(
            "Url not recognized. Please provide a valid URL https://github.com/<owner>/<repo>/actions/runs/<runId>/..."
        )
    runId = parseInt(runIdUrl)
    dbg(`runId: ${runId}`)

    jobId = parseInt(jobIdUrl)
    dbg(`jobId: ${jobId}`)

    if (runOwner !== owner)
        cancel(
            `Run owner ${runOwner} does not match the current repository owner ${owner}`
        )
    if (runRepo !== repo)
        cancel(
            `Run repository ${runRepo} does not match the current repository ${repo}`
        )
}

if (isNaN(runId)) throw new Error("You must provide a runId or runUrl")
output.itemValue(`run id`, runId)
// fetch run
const run = await github.workflowRun(runId)
dbg(`run: %O`, run)
const branch = run.head_branch
dbg(`branch: ${branch}`)

const workflow = await github.workflow(run.workflow_id)
dbg(`workflow: ${workflow.name}`)

// List workflow runs for the specified workflow and branch
const runs = await github.listWorkflowRuns(workflow.id, {
    status: "completed",
    branch,
    count: 100,
})
runs.reverse() // from newest to oldest

dbg(
    `runs: %O`,
    runs.map(({ id, conclusion, workflow_id, html_url, run_started_at }) => ({
        id,
        conclusion,
        workflow_id,
        html_url,
        run_started_at,
    }))
)

const reversedRuns = runs.filter(
    (r) => new Date(r.run_started_at) <= new Date(run.run_started_at)
)
if (!reversedRuns.length) cancel("No runs found")
dbg(
    `reversed runs: %O`,
    reversedRuns.map(
        ({ id, conclusion, workflow_id, html_url, run_started_at }) => ({
            id,
            conclusion,
            workflow_id,
            html_url,
            run_started_at,
        })
    )
)

// resolve the first failed workflow run and job
const firstFailedRun = reversedRuns.find(
    ({ conclusion }) => conclusion === "failure"
)
if (!firstFailedRun) cancel(`first failed run not found`)
output.itemLink(
    `first failed run #${firstFailedRun.run_number}`,
    firstFailedRun.html_url
)
const firstFailedJobs = await github.listWorkflowJobs(firstFailedRun.id)
const firstFailedJob =
    firstFailedJobs.find(({ conclusion }) => conclusion === "failure") ??
    firstFailedJobs[0]
const firstFailureLog = firstFailedJob.content
if (!firstFailureLog) cancel("No logs found")
output.itemLink(`first failed job`, firstFailedJob.html_url)

// resolve the latest successful workflow run
const lastSuccessRun = reversedRuns.find(
    ({ conclusion }) => conclusion === "success"
)
if (lastSuccessRun)
    output.itemLink(
        `last successful run #${lastSuccessRun.run_number}`,
        lastSuccessRun.html_url
    )
else output.item(`last successful run not found`)

let gitDiffRef: string
let logRef: string
let logDiffRef: string
if (lastSuccessRun) {
    if (lastSuccessRun.head_sha === firstFailedRun.head_sha) {
        console.debug("No previous successful run found")
    } else {
        output.itemLink(
            `diff (${lastSuccessRun.head_sha.slice(0, 7)}...${firstFailedRun.head_sha.slice(0, 7)})`,
            `https://github.com/${owner}/${repo}/compare/${lastSuccessRun.head_sha}...${firstFailedRun.head_sha}`
        )

        // Execute git diff between the last success and failed run commits
        await git.fetch("origin", lastSuccessRun.head_sha)
        await git.fetch("origin", firstFailedRun.head_sha)
        const gitDiff = await git.diff({
            base: lastSuccessRun.head_sha,
            head: firstFailedRun.head_sha,
            excludedPaths: "**/genaiscript.d.ts",
        })

        if (gitDiff) {
            gitDiffRef = def("GIT_DIFF", gitDiff, {
                language: "diff",
                lineNumbers: true,
                flex: 1,
            })
        }
    }
}

if (!lastSuccessRun) {
    // Define log content if no last successful run is available
    logRef = def("LOG", firstFailureLog, {
        maxTokens: 20000,
        lineNumbers: false,
    })
} else {
    const lastSuccessJobs = await github.listWorkflowJobs(lastSuccessRun.id)
    const lastSuccessJob = lastSuccessJobs.find(
        ({ name }) => firstFailedJob.name === name
    )
    if (!lastSuccessJob)
        console.debug(
            `could not find job ${firstFailedJob.name} in last success run`
        )
    else {
        output.itemLink(`last successful job`, lastSuccessJob.html_url)
        const jobDiff = await github.diffWorkflowJobLogs(
            firstFailedJob.id,
            lastSuccessJob.id
        )
        // Generate a diff of logs between the last success and failed runs
        logDiffRef = def("LOG_DIFF", jobDiff, {
            language: "diff",
            lineNumbers: false,
        })
    }
}

// Instruction for generating a report based on the analysis
$`Your are an expert software engineer and you are able to analyze the logs and find the root cause of the failure.

You are analyzing a FAILED_RUN and a SUCCESSFUL_RUN.

${gitDiffRef ? `- ${gitDiffRef} contains a diff of 2 run commits` : ""}
${logDiffRef ? `- ${logDiffRef} contains a diff of 2 workflow runs in GitHub Action` : ""}
${logRef ? `- ${logRef} contains the log of the failed run` : ""}

- The first run is the last successful run and the second run is the first failed run
- The commit of the first run is ${firstFailedRun.head_sha}.
${lastSuccessRun ? `- The commit of the second run is ${lastSuccessRun.head_sha}.` : ""}

Analyze the diff in LOG_DIFF and provide a summary of the root cause of the failure. Use 'agent_git' and 'agent_github' if you need more information.
Do not invent git or github information.

Show the code that is responsible for the failure.

If you cannot find the root cause, stop.

Generate a diff with suggested fixes. Use a diff format.
- If you cannot locate the error, do not generate a diff.

Report suggested fixes in the annotation format.
`

output.heading(2, `AI Analysis`)
