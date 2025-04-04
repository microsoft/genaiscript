script({
    title: "Uses playwright MCP tools.",
    system: [
        {
            id: "system.mcp",
            parameters: {
                id: "playwright",
                command: "npx",
                args: ["--yes", "@playwright/mcp@latest", "--headless"],
            },
        },
    ],
})

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`
