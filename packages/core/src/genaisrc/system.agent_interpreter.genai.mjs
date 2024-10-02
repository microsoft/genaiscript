system({
    title: "Agent that can run code interpreters for Python, Math.",
})

const model = env.vars.agentInterpreterModel
defTool(
    "agent_interpreter",
    "Run code interpreters for Python, Math. Use this agent to ground computation questions.",
    {
        query: {
            type: "string",
            description: "Query to answer",
        },
        required: ["query"],
    },
    async (args) => {
        const { context, query } = args
        context.log(`agent interpreter: ${query}`)
        const res = await runPrompt(
            (_) => {
                _.def("QUERY", query)
                _.$`You are an agent that can run code interpreters for Python, Math. 
                
                Analyze and answer QUERY. Use the best tool to ground computation questions.
                
                - Assume that your answer will be analyzed by an AI, not a human.
                - Prefer math_eval for math expressions as it is much more efficient.
                - To use file data in python, prefer copying data files using python_code_interpreter_copy_files rather than inline data in code.
                - If you cannot answer the query, return an empty string.
                `
            },
            {
                model,
                system: [
                    "system",
                    "system.tools",
                    "system.explanations",
                    "system.math",
                    "system.python_code_interpreter",
                ],
                label: "agent interpreter",
            }
        )
        return res
    }
)
