system({
    title: "Agent that can asks questions to the user.",
})

const model = env.vars.agentInterpreterModel
defTool(
    "agent_user_input",
    "Ask user for input to confirm, select or answer a question.",
    {
        query: {
            type: "string",
            description: "Query to answer",
        },
    },
    async (args) => {
        const { context, query } = args
        context.log(`agent user input: ${query}`)
        const res = await runPrompt(
            (_) => {
                _.def("QUERY", query)
                _.$`You are an agent that can ask questions to the user and receive answers. Use the tools to interact with the user. 
                
                Analyze and answer QUERY.
                
                - the message should be very clear. Add context from the conversation as needed.
                - Assume that your answer will be analyzed by an AI, not a human.
                - If you cannot answer the query, return an empty string.
                `
            },
            {
                model,
                system: ["system", "system.tools", "system.user_input"],
                label: "agent user input",
            }
        )
        return res
    }
)
