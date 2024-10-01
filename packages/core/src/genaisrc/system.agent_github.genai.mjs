system({
    title: "Agent that can query GitHub and Git to accomplish tasks",
    parameters: {
        agentGithubModel: {
            type: "string",
            description: "Model to use for the agent",
        },
    },
})

const model = env.vars.agentGithubModel

defTool(
    "agent_github",
    "Agent that can query GitHub and Git to accomplish tasks",
    {
        query: {
            type: "string",
            description: "Query to answer",
        },
    },
    async (args) => {
        const { context, query } = args
        context.log(`agent github: ${query}`)
        const res = await runPrompt(
            (_) => {
                _.def("QUERY", query)

                _.$`Your are a helpfull LLM agent that can query GitHub, Git and read files to accomplish tasks. 
                
                Analyze and answer QUERY.
                
                - Assume that your answer will be analyzed by an LLM, not a human.
                - If you cannot answer the query, return an empty string.
                `
            },
            {
                model,
                system: [
                    "system",
                    "system.tools",
                    "system.explanations",
                    "system.fs_find_files",
                    "system.fs_read_file",
                    "system.git",
                    "system.github_actions",
                    "system.github_files",
                    "system.github_issues",
                    "system.github_pulls",
                ],
            }
        )
        return res
    }
)
