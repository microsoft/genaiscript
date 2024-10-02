system({
    title: "Agent that can query GitHub to accomplish tasks.",
})

const model = env.vars.agentGithubModel

defTool(
    "agent_github",
    "Agent that can query GitHub  to accomplish tasks",
    {
        query: {
            type: "string",
            description: "Query to answer",
        },
        required: ["query"],
    },
    async (args) => {
        const { context, query } = args
        context.log(`agent github: ${query}`)
        const res = await runPrompt(
            (_) => {
                _.def("QUERY", query)

                _.$`Your are a helpfull LLM agent that can query GitHub to accomplish tasks. 
                
                Analyze and answer QUERY.
                
                ## Constraints

                - Assume that your answer will be analyzed by an LLM, not a human.
                - If you cannot answer the query, return an empty string.
                - Prefer diffing job logs rather downloading entire logs which can be very large.

                `
            },
            {
                model,
                system: [
                    "system",
                    "system.tools",
                    "system.explanations",
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
