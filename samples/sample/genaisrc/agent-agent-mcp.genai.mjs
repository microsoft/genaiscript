script({
  title: "Wraps the playwright MCP server with an agent in an agent.",
});

$`Extract the OpenAI pricing from https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/.

Generate a markdown table with the name, price for each models.
Use tools to extract data from web pages.`;

defAgent(
  "mcp",
  `can use MCP tools to access external resources.
    - Use the tool call responses to create your answer.
    - Be specific and exact when handling urls. Do not try to simplify or change URLs.`,
  `Use available tools to answer to the <QUERY>.`,
  {
    mcpAgentServers: {
      playwright: {
        description: "An agent that uses playwright to run browser commands.",
        command: "npx",
        args: ["--yes", "@playwright/mcp@latest", "--headless"],
        instructions: "Use the playwright tools as the Browser Automation Tools.",
        maxTokens: 12000,
      },
    },
  },
);
