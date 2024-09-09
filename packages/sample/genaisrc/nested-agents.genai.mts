script({ model: "openai:gpt-4o" })

/**
 * This agent loads the file system prompts.
 */
defTool(
    "agent_file_system",
    `An agent that uses gpt-4o to execute an LLM requests with tools that can search and read the file system.
    `,
    {
        prompt: {
            type: "string",
            description: "the prompt to be executed by the LLM",
        },
    },
    async ({ prompt }) =>
        await env.generator.runPrompt(
            (_) => {
                _.$`You are an AI assistant that can help with file system tasks.

                Answer the user question in the most concise way possible. Use wildcards and regex if needed.
                If the question is ambiguous, ask for clarification.
                Use tools to search and read the file system.
                
                QUESTION:`
                _.writeText(prompt)
            },
            {
                model: "openai:gpt-4o",
                label: `llm-4o agent_fs ${prompt}`,
                tools: "fs",
            }
        )
)

/**
 * This agent loads the file system prompts.
 */
defTool(
    "agent_code_interpreter",
    "An LLM agent that execute python code in a sandboxed container.",
    {
        code: {
            type: "string",
            description: "the python to be executed by the LLM",
        },
    },
    async ({ code }) =>
        await env.generator.runPrompt(code, {
            model: "openai:gpt-4o",
            label: "llm-4o agent_fs",
            tools: "python",
        })
)

// now as a question about the file system
$`Do a statistical analyzis of all data (*.csv) in the project.`
