system({
    title: "Agent that can query Git to accomplish tasks.",
})

const model = env.vars.agentGitModel

defTool(
    "agent_git",
    "Agent that can query a repository using Git to accomplish tasks. Provide all the context information available to execute git queries.",
    {
        query: {
            type: "string",
            description: "Query to answer",
        },
    },
    async (args) => {
        const { context, query } = args
        context.log(`agent git: ${query}`)
        const res = await runPrompt(
            (_) => {
                _.def("QUERY", query)

                _.$`Your are a helpfull LLM agent that can use git tools to query a repository. 
                
                Analyze and answer QUERY.
                
                - Assume that your answer will be analyzed by an LLM, not a human.
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
                    "system.git",
                ],
                label: "agent git",
            }
        )
        return res
    }
)
