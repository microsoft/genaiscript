script({
    title: "Weather MCP Configuration Demo",
    description: "Demonstrates using weather MCP server with mcpServers configuration vs programmatic approach",
    model: "small",
    parameters: {
        cities: {
            type: "string",
            description: "Comma-separated list of cities to check weather for",
            default: "Paris, London, Tokyo"
        },
        useConfig: {
            type: "boolean",
            description: "Whether to use mcpServers config (true) or programmatic approach (false)",
            default: false
        }
    },
    // Configure MCP servers using mcpServers config
    // This demonstrates how to configure MCP servers in the script metadata
    // For HTTP servers like our weather server, we still need to use host.mcpServer() programmatically
    mcpServers: {
        // Example of process-based MCP server (commented out since we use HTTP)
        // fetch: {
        //     command: "docker",
        //     args: ["run", "-i", "--rm", "mcp/fetch"]
        // }
    }
})

// Parse the cities parameter
const cities = (env.vars.cities || "Paris, London, Tokyo")
    .split(",")
    .map(city => city.trim())
    .filter(city => city.length > 0)

const useConfig = env.vars.useConfig === "true" || env.vars.useConfig === true

$`# Weather Report Demo - MCP Configuration vs Programmatic

This example demonstrates two approaches to using MCP servers in GenAIScript:

1. **Programmatic approach**: Using \`host.mcpServer()\` to connect directly
2. **Configuration approach**: Using \`mcpServers\` in script metadata (for process-based servers)

**Note**: Since our weather server uses HTTP transport, both approaches use \`host.mcpServer()\` 
programmatically. The \`mcpServers\` configuration is typically used for process-based MCP servers 
that are launched via command line.

I will check the weather for the following cities: ${cities.join(", ")}.
`

// For HTTP-based MCP servers, we use the programmatic approach
const weatherServer = await host.mcpServer({
    id: "weather",
    type: "http", 
    url: "http://localhost:3001/mcp"
})

if (useConfig) {
    $`
## Using Configuration Approach

In this mode, we would typically rely on MCP servers configured in the \`mcpServers\` section 
of the script metadata. However, since our weather server uses HTTP transport, we still need 
to connect programmatically using \`host.mcpServer()\`.

For process-based MCP servers, you would configure them like:
\`\`\`typescript
mcpServers: {
    fetch: {
        command: "docker",
        args: ["run", "-i", "--rm", "mcp/fetch"]
    }
}
\`\`\`

The tools would then be automatically available in the script context.
`
} else {
    $`
## Using Programmatic Approach

In this mode, we explicitly connect to the MCP server using \`host.mcpServer()\`:

\`\`\`typescript
const weatherServer = await host.mcpServer({
    id: "weather",
    type: "http",
    url: "http://localhost:3001/mcp"
})
\`\`\`

Then we can call tools directly on the server instance.
`
}

$`
## Weather Information

Let me gather weather data for each city:
`

// Get current weather for each city
for (const city of cities) {
    try {
        const currentWeather = await weatherServer.callTool("get_current_weather", { location: city })
        $`
### Weather in ${city}

${currentWeather.text}
`
    } catch (error) {
        $`
### Weather in ${city}

❌ Error getting weather data: ${error.message}
(This is expected if the weather MCP server is not running)
`
    }
}

// Get forecast for the first city
if (cities.length > 0) {
    const firstCity = cities[0]
    try {
        const forecast = await weatherServer.callTool("get_weather_forecast", { location: firstCity })
        $`
### 3-Day Forecast for ${firstCity}

${forecast.text}
`
    } catch (error) {
        $`
### 3-Day Forecast for ${firstCity}

❌ Error getting forecast data: ${error.message}
(This is expected if the weather MCP server is not running)
`
    }
}

// Compare weather between first two cities if available
if (cities.length >= 2) {
    try {
        const comparison = await weatherServer.callTool("compare_weather", { 
            city1: cities[0], 
            city2: cities[1] 
        })
        $`
### Weather Comparison

${comparison.text}
`
    } catch (error) {
        $`
### Weather Comparison

❌ Error comparing weather data: ${error.message}
(This is expected if the weather MCP server is not running)
`
    }
}

$`
## Summary

This example demonstrates:
- **Programmatic approach**: Direct control over MCP server connections using \`host.mcpServer()\`
- **Configuration approach**: Declarative MCP server setup in script metadata (best for process-based servers)
- **HTTP transport**: How to connect to MCP servers running as HTTP services
- **Error handling**: Graceful handling of connection errors when servers are not available

To run the weather MCP server, use:
\`\`\`bash
./samples/tools/start-weather-mcp.sh
\`\`\`

Then run this script again to see live weather data!
`