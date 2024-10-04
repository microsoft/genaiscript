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
                - Prefer diffing job logs rather downloading entire logs which can be very large.
                - If you are missing information, reply "MISSING_INFO: <what is missing>".
                - If you cannot answer the query, return "NO_ANSWER: <reason>".

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
                label: "agent github",
            }
        )
        return res
    }
)
