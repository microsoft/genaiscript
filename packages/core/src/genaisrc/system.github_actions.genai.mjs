system({
    title: "github workflows",
    description: "Queries results from workflows in GitHub actions.",
})

defTool(
    "github_actions_list_workflows",
    "List all workflows as a list of 'id: name' pair.",
    {},
    async (args) => {
        const res = await github.listWorkflows()
        return CSV.stringify(
            res.map(({ id, name }) => ({ id, name })),
            { header: true }
        )
    }
)

defTool(
    "github_actions_list_runs",
    "List all runs for a workflow. Use 'git_actions_list_workflows' to list workflows.",
    {
        workflow_id: {
            type: "string",
            description: "ID of the workflow to list runs for.",
        },
        branch: {
            type: "string",
            description: "Branch to list runs for.",
        },
        status: {
            type: "string",
            description: "Filter runs by status: success, failured.",
        },
        required: ["workflow_id"],
    },
    async (args) => {
        const { workflow_id, branch, status } = args
        const res = await github.listWorkflowRuns(workflow_id, {
            branch,
            status,
        })
        return CSV.stringify(
            res.map(({ id, name, conclusion, head_sha }) => ({
                id,
                name,
                conclusion,
                head_sha,
            })),
            { header: true }
        )
    }
)

defTool(
    "github_action_list_jobs",
    "List all jobs for a run.",
    {
        run_id: {
            type: "string",
            description:
                "ID of the run to list jobs for. Use 'git_actions_list_runs' to list runs for a workflow.",
        },
        required: ["run_id"],
    },
    async (args) => {
        const { run_id } = args
        const res = await github.listWorkflowJobs(run_id)
        return CSV.stringify(
            res.map(({ id, name, status }) => ({ id, name, status })),
            { header: true }
        )
    }
)
