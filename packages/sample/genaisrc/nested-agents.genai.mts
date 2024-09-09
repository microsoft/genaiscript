defTool(
    "agent-fs",
    "Invokes gpt-4o to execute a LLM request",
    {
        prompt: {
            type: "string",
            description: "the prompt to be executed by the LLM",
        },
    },
    async ({ prompt }) => {
        const res = await env.generator.runPrompt(_ => {
            _.writeText(prompt)
        }, {
            model: "openai:gpt-4o",
            label: "llm-4o with fs",
            tools: "fs"
        })
        return res.text
    }
)
