script({
  description: "Model Context Protocol server demo",
  model: "small",
  tests: {
    keywords: "issues",
  },
  mcpServers: {
    fetch: {
      command: "uvx",
      args: ["mcp-server-fetch"],
    },
  },
});

$`Summarize https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/SUPPORT.md`;
