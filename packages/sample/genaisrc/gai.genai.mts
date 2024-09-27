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
const { owner, repo } = await github.info()
const runs = await github.listWorkflowRuns(workflow, { branch })
if (!runs.length) cancel("No runs found")

// find build
let ffi = ffid
    ? runs.findIndex(({ id }) => id === ffid)
    : runs.findIndex(({ conclusion }) => conclusion === "failure")
if (ffi < 0) ffi = 0
const ff = runs[ffi]
console.log(
    `  run: ${ff.id}, ${ff.conclusion}, ${ff.created_at}, ${ff.head_sha}, ${ff.html_url}`
)

// first last success
const lsi = lsid
    ? runs.slice(ffi).findIndex(({ id }) => id === lsid)
    : runs.slice(ffi).findIndex(({ conclusion }) => conclusion === "success")
const ls = runs[lsi]
if (ls) {
    console.log(
        `  last success: ${ls.id}, ${ls.conclusion}, ${ls.created_at}, ${ls.head_sha}, ${ls.html_url}`
    )
    const gitDiff = await host.exec(
        `git diff ${ls.head_sha} ${ff.head_sha} -- . :!**/genaiscript.d.ts`
    )
    console.log(`> source diff: ${(gitDiff.stdout.length / 1000) | 0}kb`)
    def("GIT_DIFF", gitDiff, {
        language: "diff",
        maxTokens: 10000,
        lineNumbers: true,
    })
}

// download logs
const ffjobs = await github.listWorkflowJobs(ff.id)
const ffjob =
    ffjobs.find(({ conclusion }) => conclusion === "failure") ?? ffjobs[0]
const fflog = ffjob.content
if (!fflog) cancel("No logs found")
console.log(`> run log: ${(fflog.length / 1000) | 0}kb  ${ffjob.logs_url}`)
if (!ls) {
    def("LOG", fflog, { maxTokens: 20000, lineNumbers: false })
} else {
    const lsjobs = await github.listWorkflowJobs(ls.id)
    const lsjob = lsjobs.find(({ name }) => ffjob.name === name)
    if (!lsjob)
        console.log(`could not find job ${ffjob.name} in last success run`)
    else {
        const lslog = lsjob.content
        console.log(
            `> last success log: ${(lslog.length / 1000) | 0}kb ${lsjob.logs_url}`
        )

        // include difss
        defDiff("LOG_DIFF", lslog, fflog, {
            maxTokens: 20000,
            lineNumbers: false,
        })
    }
}
$`Your are an expert software engineer and you are able to analyze the logs and find the root cause of the failure.

${ls ? "- GIT_DIFF contains a diff of 2 run commits" : ""}
${ls ? "- LOG_DIFF contains a diff of 2 runs in GitHub Action" : "- LOG contains the log of the failed run"}
- The first run is the last successful run and the second run is the first failed run

Add links to run logs.

Analyze the diff in LOG_DIFF and provide a summary of the root cause of the failure.

If you cannot find the root cause, stop.

Generate a diff with suggested fixes. Use a diff format.
- If you cannot locate the error, do not generate a diff.`

writeText(
    `## Investigator report
- [run failure](${ff.html_url})
${ls ? `, [run last success](${ls.html_url})` : ""}
, [${ff.head_sha.slice(0, 7)}](${ff.html_url})
${ls ? `, [diff ${ls.head_sha.slice(0, 7)}...${ff.head_sha.slice(0, 7)}](https://github.com/${owner}/${repo}/compare/${ls.head_sha}...${ff.head_sha})` : ""}

`,
    { assistant: true }
)
