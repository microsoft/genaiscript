script({
    tools: ["agent_fs", "agent_git", "agent_github"],
    tests: {},
})

const workflow = env.vars.workflow || "build.yml"
const branch = env.vars.branch || "current"
const run = env.vars.run || ""

$`Investigate the status of run ${run} of workflow ${workflow} in the ${branch} branch.

If the run failed, analyze the logs and identify the root cause of the failure.

- Break down the steps in the workflow.
- Take a deep breadth and think step by steps.
- Use git diff to compare the changes with the latest successful run.
- Analyze one run log at a time and stop once you find the root cause.
`
