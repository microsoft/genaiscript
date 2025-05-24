import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

We've added support to configure MCP servers in the script metadata and wrap them with agents.
As a result, you can now run multiple MCP servers in parallel, each with its own agent.

```js "mcpAgentServers" wrap
script({
    title: "Wraps the playwright MCP server with an agent.",
    mcpAgentServers: {
        playwright: {
            description:
                "An agent that uses playwright to run browser commands.",
            command: "npx",
            args: ["--yes", "@playwright/mcp@latest", "--headless"],
            instructions:
                "Use the playwright tools as the Browser Automation Tools.",
        },
    },
})

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`
```

## Just want servers?

Don't want to go through the agent abstraction? You can also inject the MCP server directly in the prompt using the `mcpServers` field.

```js title="mcpServers" wrap
script({
    title: "Uses playwright MCP tools.",
    mcpServers: {
        playwright: {
            command: "npx",
            args: ["--yes", "@playwright/mcp@latest", "--headless"],
        },
    },
})

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`
```