import { calculator } from "@agentic/calculator";

// usual
defTool("foo", "bar", {}, () => "");
// Tool callback
defTool({
  spec: {
    name: "test",
  },
  impl: () => undefined,
});
// MCP
defTool({
  memory: {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
  },
});
// agentic
defTool(calculator as any);
