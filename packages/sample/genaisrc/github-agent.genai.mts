script({
    tools: ["agent_fs", "agent_git", "agent_github"],
    tests: {},
})

$`Investigate the status of the **latest** failed github workflows and identify the root cause of the failure.

- Correlate the failure with the relevant commits, pull requests or issues.
- Compare the source code between the failed run and the last successful run before that run.

In your report, include html links to the relevant runs, commits, pull requests or issues.
`
