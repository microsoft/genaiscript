script({
    title: "Wraps the playwright MCP server with an agent.",
    system: [
        {
            id: "system.agent_mcp",
            parameters: {
                id: "playwright",
                description:
                    "An agent that uses playwright to run browser commands.",
                command: "npx",
                args: ["--yes", "@playwright/mcp@latest"],
                instructions:
                    "Use the playwright tools as the Browser Automation Tools.",
            },
        },
    ],
})

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`
