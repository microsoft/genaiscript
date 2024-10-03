script({
    tools: ["fs", "git", "github"],
    parameters: {
        workflow: { type: "string" }, // Workflow name
        failure_run_id: { type: "number" }, // ID of the failed run
        success_run_id: { type: "number" }, // ID of the successful run
        branch: { type: "string" }, // Branch name
    },
})

const {
    workflow = "latest failed",
    failure_run_id = "latest",
    branch = await git.defaultBranch(),
} = env.vars

$`Investigate the status of the ${workflow} workflow and identify the root cause of the failure of run ${failure_run_id} in branch ${branch}.

- Correlate the failure with the relevant commits, pull requests or issues.
- Compare the source code between the failed run and the last successful run before that run.

In your report, include html links to the relevant runs, commits, pull requests or issues.
`
