system({
    title: "github workflows",
    description: "Queries results from workflows in GitHub actions.",
})

defTool(
    "github_actions_workflows_list",
    "List all workflows as a list of 'id: name' pair.",
    {},
    async (args) => {
        const { context } = args
        context.log("github action list workflows")
        const res = await github.listWorkflows()
        return CSV.stringify(
            res.map(({ id, name }) => ({ id, name })),
            { header: true }
        )
    }
)

defTool(
    "github_actions_runs_list",
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
            description: "Filter runs by completion status: success, failured.",
        },
        required: ["workflow_id"],
    },
    async (args) => {
        const { workflow_id, branch, status, context } = args
        context.log(
            `github action list runs for worfklow ${workflow_id} and branch ${branch || "all"}`
        )
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
    "github_actions_jobs_list",
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
        const { run_id, context } = args
        context.log(`github action list jobs for run ${run_id}`)
        const res = await github.listWorkflowJobs(run_id)
        return CSV.stringify(
            res.map(({ id, name, status }) => ({ id, name, status })),
            { header: true }
        )
    }
)

defTool(
    "github_actions_job_logs_get",
    "Download workflow job log.",
    {
        job_id: {
            type: "string",
            description: "ID of the job to download log for.",
        },
        required: ["job_id"],
    },
    async (args) => {
        const { job_id, context } = args
        context.log(`github action download job log ${job_id}`)
        const log = await github.downloadWorkflowJobLog(job_id, {
            llmify: true,
        })
        return log
    }
)

defTool(
    "github_actions_job_los_diff",
    "Diffs two workflow job logs.",
    {
        job_id: {
            type: "string",
            description: "ID of the job to compare.",
        },
        other_job_id: {
            type: "string",
            description: "ID of the other job to compare.",
        },
        required: ["job_id", "other_job_id"],
    },
    async (args) => {
        const { job_id, other_job_id, context } = args
        context.log(`github action diff job logs ${job_id} ${other_job_id}`)
        const log = await github.diffWorkflowJobLogs(job_id, other_job_id)
        return log
    }
)
