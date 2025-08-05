script({
    title: "Weather MCP Servers Config Demo",
    description: "Simple example using mcpServers configuration",
    model: "small",
    parameters: {
        cities: {
            type: "string",
            description: "Comma-separated list of cities to check weather for",
            default: "Paris, London"
        }
    },
    // Note: mcpServers is for process-based MCP servers
    // For HTTP servers like our weather example, use the programmatic approach instead
    mcpServers: {
        // Example of process-based MCP server configuration:
        // fetch: {
        //     command: "npx",
        //     args: ["@modelcontextprotocol/server-fetch"]
        // }
    }
})

const cities = (env.vars.cities || "Paris, London")
    .split(",")
    .map(city => city.trim())
    .filter(city => city.length > 0)

$`# Weather Report Using MCP Configuration

This demonstrates the mcpServers configuration approach.

**Note**: Since our weather server uses HTTP transport, we need to use the programmatic approach instead.
The mcpServers configuration is designed for process-based MCP servers that can be launched via command line.

For HTTP-based MCP servers, see the weather-mcp-http.genai.mts example.

Cities to check: ${cities.join(", ")}

To use process-based MCP servers, you would configure them in the mcpServers section:
\`\`\`typescript
mcpServers: {
    fetch: {
        command: "npx",
        args: ["@modelcontextprotocol/server-fetch"]
    }
}
\`\`\`

The tools would then be automatically available in the script context.
`