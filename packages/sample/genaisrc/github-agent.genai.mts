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
        branch: { type: "string" }, // Branch name
    },
})

const { workflow = "build.yml", branch = await git.branch() } = env.vars

$`
0. Find the worflow ${workflow} in the repository
1. Find the latest failed run of ${workflow} for branch ${branch}
2. Find the last successful run before the failed run
3. Compare the run job logs between the failed run and the last successful run
4. Compare the source code between the failed run commit (head_sha) and the last successful run commit (head_sha)
    - show a diff of the source code that created the problem if possible
5. Analyze all the above information and identify the root cause of the failure
    - generate a patch to fix the problem if possible

In your report, include html links to the relevant runs, commits, pull requests or issues.
`
