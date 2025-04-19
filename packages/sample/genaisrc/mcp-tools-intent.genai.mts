script({
    title: "Uses playwright MCP tools.",
    mcpServers: {
        playwright: {
            command: "npx",
            args: ["--yes", "@playwright/mcp@latest", "--headless"],
            intent: "description",
        },
    },
})
$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`
