
It is possible [tools](/genaiscript/reference/scripts/tools)
and [inline prompts](/genaiscript/reference/scripts/inline-prompts)
to create a tool that uses an LLM model to execute a prompt.

```js "defTool" "runPrompt"
defTool(
    "llm-small",
    "Invokes smaller LLM",
    {
        prompt: {
            type: "string",
            description: "the prompt to be executed by the LLM",
        },
    },
    async ({ prompt }) =>
        await runPrompt(prompt, {
            model: "small",
            label: "llm-small",
        })
)
```

The `"small"` model is an alias that can be configured in the `script` metadata, cli arguments or environment variables.

```js "small"
script({
    smallModel: "openai:gpt-4o-mini",
})
```

The inlined prompts can declare their own tools or use system prompts declaring them.

```js 'tools: "fs"'
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
```
