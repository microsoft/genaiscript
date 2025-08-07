script({
    title: "Weather MCP Servers Config Demo",
    description: "Simple example using mcpServers configuration",
    model: "small",
    parameters: {
        city: {
            type: "string",
            description: "City to check weather for",
            default: "Paris"
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
        
        // Weather MCP Server Info:
        // - Server file: samples/tools/weather-mcp-server.mjs
        // - Port: 3001 (configurable via MCP_PORT env var)
        // - Transport: HTTP (not process-based, so can't use mcpServers config)
        // - Tools provided:
        //   * get_current_weather: Get current weather for a city
        //   * get_weather_forecast: Get 3-day weather forecast
        //   * compare_weather: Compare weather between two cities
        // - Available cities: Paris, London, New York, Tokyo, Sydney, Berlin, Moscow, Mumbai, Cairo, Vancouver
        // 
        // To use the weather server:
        // 1. Start server: node samples/tools/weather-mcp-server.mjs
        // 2. Use programmatically in scripts (see weather-mcp-http.genai.mts)
    }
})

const city = env.vars.city || "Paris"

$`# Weather MCP Server - Configuration Demo

This demonstrates the mcpServers configuration approach and provides information about our weather MCP server.

## About the Weather MCP Server

**Location**: \`samples/tools/weather-mcp-server.mjs\`
**Transport**: HTTP (runs on port 3001)
**Tools**:
- \`get_current_weather\` - Get current weather for a city
- \`get_weather_forecast\` - Get 3-day weather forecast  
- \`compare_weather\` - Compare weather between two cities

**Available Cities**: Paris, London, New York, Tokyo, Sydney, Berlin, Moscow, Mumbai, Cairo, Vancouver

**To start the server**:
\`\`\`bash
node samples/tools/weather-mcp-server.mjs
\`\`\`

## MCP Configuration Types

**Note**: Since our weather server uses HTTP transport, we need to use the programmatic approach instead.
The mcpServers configuration is designed for process-based MCP servers that can be launched via command line.

For HTTP-based MCP servers like our weather example, see \`weather-mcp-http.genai.mts\`.

Example city: ${city}

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