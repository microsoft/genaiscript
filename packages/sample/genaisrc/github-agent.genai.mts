script({
    tools: ["agent_fs", "agent_github"],
    tests: {},
})

$`Investigate the run status of build.yml in the current branch.

If the run failed, analyze the logs and identify the root cause of the failure.0

- Break down the steps in the workflow.
- Take a deep breadth and think step by steps.
- Use git diff to compare the changes with the latest successful run.
- Analyze one run log at a time and stop once you find the root cause.
`
