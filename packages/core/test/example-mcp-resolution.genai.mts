/**
 * Example test showing the new MCP server resolution by ID feature
 */

script({
    title: "Test MCP Server Resolution by ID",
    description: "Demonstrates the new feature to reference MCP servers by ID from mcp.json files",
    system: [
        // This would now work by just providing an ID - it will resolve configuration from mcp.json files
        "system.mcp",
    ],
    vars: {
        "system.mcp.id": "test-memory-server", // Only ID needed, config resolved from .vscode/mcp.json
        // No need to provide command, args, etc. - they're resolved automatically
    },
})

// Simple test prompt
$`List the available MCP tools and explain what this server provides.`