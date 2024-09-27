/* spellchecker: disable */

script({
    title: "GitHub Action Investigator",
    description:
        "Analyze GitHub Action runs to find the root cause of a failure",
    parameters: {
        workflow: { type: "string" },
        failure_run_id: { type: "number" },
        success_run_id: { type: "number" },
        branch: { type: "string" },
    },
})

const workflow = env.vars.workflow || "build.yml"
const ffid = env.vars.failure_run_id
const lsid = env.vars.success_run_id
const branch =
    env.vars.branch ||
    (await host.exec("git branch --show-current")).stdout.trim()

const runs = await github.listWorkflowRuns(workflow, { branch })

// first last success
const lsi = lsid
    ? runs.findIndex(({ id }) => id === lsid)
    : runs.findIndex(({ conclusion }) => conclusion === "success")
const ls = runs[lsi]
if (!ls) cancel("last success run not found")
console.log(
    `> last success: ${ls.id}, ${ls.created_at}, ${ls.head_sha}, ${ls.html_url}`
)
const ff = ffid ? runs.find(({ id }) => id === ffid) : runs[lsi - 1]
if (!ff) cancel("failure run not found")
console.log(
    `> first failure: ${ff.id}, ${ff.created_at}, ${ff.head_sha}, ${ff.html_url}`
)
if (ff.conclusion !== "failure") cancel("failure run not found")

const gitDiff = await host.exec(
    `git diff ${ls.head_sha} ${ff.head_sha} -- . :!**/genaiscript.d.ts`
)
console.log(`> source diff: ${(gitDiff.stdout.length / 1000) | 0}kb`)

// download logs
const ffjobs = await github.listWorkflowJobs(ff.id)
const ffjob = ffjobs.find(({ conclusion }) => conclusion === "failure")
const fflog = ffjob.content
console.log(
    `> first failure log: ${(fflog.length / 1000) | 0}kb  ${ffjob.logs_url}`
)

const lsjobs = await github.listWorkflowJobs(ls.id)
const lsjob = lsjobs.find(({ name }) => ffjob.name === name)
const lslog = lsjob.content
console.log(
    `> last success log: ${(lslog.length / 1000) | 0}kb ${lsjob.logs_url}`
)

// include difss
def("GIT_DIFF", gitDiff, {
    language: "diff",
    maxTokens: 10000,
    lineNumbers: true,
})
defDiff("LOG_DIFF", parseJobLog(lslog), parseJobLog(fflog), {
    maxTokens: 20000,
    lineNumbers: false,
})
$`Your are an expert software engineer and you are able to analyze the logs and find the root cause of the failure.

- GIT_DIFF contains a diff of 2 run commits
- LOG_DIFF contains a diff of 2 runs in GitHub Action
- The first run is the last successful run and the second run is the first failed run

Add links to run logs.

Analyze the diff in LOG_DIFF and provide a summary of the root cause of the failure.

If you cannot find the root cause, stop.

Generate a diff with suggested fixes. Use a diff format.
- If you cannot locate the error, do not generate a diff.`

writeText(
    `## Investigator report
- [run failure](${ff.html_url})
, [run last success](${ls.html_url})
, [${ff.head_sha.slice(0, 7)}](${ff.html_url})
, [diff ${ls.head_sha.slice(0, 7)}...${ff.head_sha.slice(0, 7)}](https://github.com/${owner}/${repo}/compare/${ls.head_sha}...${ff.head_sha})

`,
    { assistant: true }
)
