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
            maxTokens: 12000,
        },
    },
})

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`
