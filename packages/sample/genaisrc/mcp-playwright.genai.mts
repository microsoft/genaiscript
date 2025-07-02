script({
  title: "Uses playwright MCP tools.",
  group: "mcp",
  accept: "none",
  mcpServers: {
    playwright: {
      command: "npx",
      args: ["--yes", "@playwright/mcp@latest", "--headless"],
      toolsSha: "52cf857f903a115dd40faacfaf5882ea532351566c9bc8949ac1e31a72ab44a5",
    },
  },
});

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/`;
