script({
    tools: [
        "agent_fs",
        "agent_git",
        "agent_github",
        "agent_interpreter",
        "agent_docs",
    ],
    model: "reasoning",
    parameters: {
        jobUrl: { type: "string" }, // URL of the job
        workflow: { type: "string" }, // Workflow name
        failure_run_id: { type: "number" }, // ID of the failed run
        branch: { type: "string" }, // Branch name
    },
})

const {
    workflow = "build.yml",
    failure_run_id,
    branch = await git.branch(),
    jobUrl,
} = env.vars

if (jobUrl) {
    $`1. Extract the run id and job id from the  ${jobUrl}`
    $`2. Find the last successful run before the failed run for the same workflow and branch`
} else if (failure_run_id) {
    $`1. Find the failed run ${failure_run_id} of ${workflow} for branch ${branch}
    2. Find the last successful run before the failed run for the same workflow and branch`
} else {
    $`0. Find the worflow ${workflow} in the repository
1. Find the latest failed run of ${workflow} for branch ${branch}
2. Find the last successful run before the failed run`
}
$`3. Compare the run job logs between the failed run and the last successful run
4. git diff the failed run commit (head_sha) and the last successful run commit
    - show a diff of the source code that created the problem if possible
5. Analyze all the above information and identify the root cause of the failure
    - generate a patch to fix the problem if possible
6. Generate a detailled report of the failure and the root cause
    - include a list of all HTML urls to the relevant runs, commits, pull requests or issues
    - include diff of code changes
    - include the patch if generated
    - include a summary of the root cause
`

defOutputProcessor(async ({ messages }) => {
    await runPrompt((_) => {
        _.$`- Generate a pseudo code summary of the plan implemented in MESSAGES. MESSAGES is a LLM conversation with tools.
        - Judge the quality of the plan and suggest 2 improvements.
        - Generate a python program that optimizes the plan in code. Assume "llm" is a LLM call.`
        _.def(
            "MESSAGES",
            messages
                .map(
                    (msg) =>
                        _.$`- ${msg.role}: ${msg.content || msg.value || JSON.stringify(msg)}`
                )
                .join("\n")
        )
    })
    return undefined
})
