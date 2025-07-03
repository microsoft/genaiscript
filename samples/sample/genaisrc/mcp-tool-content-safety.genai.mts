script({
  title: "Uses playwright MCP tools.",
});

defTool({
  playwright: {
    command: "npx",
    args: ["--yes", "@playwright/mcp@latest", "--headless"],
    detectPromptInjection: "always",
  },
});

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`;
