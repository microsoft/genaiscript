script({
    title: "Weather MCP Example",
    description: "Simple example using MCP server for weather in Paris",
    model: "small",
    mcpServers: {
        weather: {
            url: "http://localhost:3001/mcp"
        }
    }
})

// Access the weather MCP server
const weather = await host.mcpServer({ id: "weather", url: "http://localhost:3001/mcp" })

$`# Weather in Paris

I will get the current weather information for Paris using the MCP weather server.
`

// Get current weather for Paris
try {
    const result = await weather.callTool("get_current_weather", { location: "Paris" })
    $`
## Current Weather in Paris

${result.text}

Please provide a brief summary of the weather conditions and any recommendations for outdoor activities.
`
} catch (error) {
    $`
❌ Error getting weather data: ${error.message}

Make sure the weather server is running:
\`\`\`bash
node samples/tools/weather-mcp-server.mjs
\`\`\`
`
}