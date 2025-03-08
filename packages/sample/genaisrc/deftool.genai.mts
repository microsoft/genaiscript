import { calculator } from "@agentic/calculator"

// usual
defTool("foo", "bar", {}, () => "")
// Toolcallback
defTool({
    spec: {
        name: "test",
    },
    impl: () => undefined,
})
// MCP
defTool({
    memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
    },
})
// agentic
defTool(calculator)
