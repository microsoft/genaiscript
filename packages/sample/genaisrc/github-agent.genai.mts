script({
    tools: [
        "agent_fs",
        "agent_git",
        "agent_github",
        "agent_interpreter",
        "agent_docs",
        "agent_memory",
    ],
    parameters: {
        workflow: { type: "string" }, // Workflow name
        failure_run_id: { type: "number" }, // ID of the failed run
        success_run_id: { type: "number" }, // ID of the successful run
        branch: { type: "string" }, // Branch name
    },
})

const {
    workflow = "build.yml",
    failure_run_id = "latest",
    branch = await git.branch(),
} = env.vars

$`
0. Find the worflow ${workflow} in the repository
1. Find the latest failed run of ${workflow}
2. Find the last successful run before the failed run
3. Compare the run job logs between the failed run and the last successful run
4. Compare the source code between the failed run commit (head_sha) and the last successful run commit (head_sha)
    - show a diff of the source code that created the problem if possible
5. Analyze all the above information and identify the root cause of the failure
    - generate a patch to fix the problem if possible

In your report, include html links to the relevant runs, commits, pull requests or issues.
`
