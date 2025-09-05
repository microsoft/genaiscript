script({
  description: "Model Context Protocol server demo",
  model: "small",
  tests: {
    keywords: "issues",
  },
  mcpServers: {
    fetch: {
      command: "docker",
      args: ["run", "-i", "--rm", "mcp/fetch"],
    },
  },
});

$`Summarize https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/main/SUPPORT.md`;
