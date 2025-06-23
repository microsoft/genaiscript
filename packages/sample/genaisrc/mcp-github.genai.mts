script({
  title: "Issue Report (MCP Force)",
  description: "Force MCP GitHub tool calls for issue reporting",
  systemSafety: true,
  tools: ["mcp"],
  mcpServers: {
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        HOME: "",
        LOGNAME: "",
        PATH: "",
        SHELL: "",
        TERM: "",
        USER: "",
        GITHUB_TOKEN: "",
      },
    },
  },
});

$`Find the latest issues in twitter bootstrap and summarize it, return it`;
