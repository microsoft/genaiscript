script({
    title: "Weather MCP Simple Demo",
    description: "Very simple weather check using MCP",
    model: "small",
    parameters: {
        city: {
            type: "string",
            description: "City to check weather for",
            default: "Tokyo"
        }
    }
})

const city = env.vars.city || "Tokyo"

$`# Simple Weather Check for ${city}`

try {
    const weather = await host.mcpServer({
        id: "weather",
        type: "http", 
        url: "http://localhost:3001/mcp"
    })

    const result = await weather.callTool("get_current_weather", { location: city })
    $`${result.text}`
    
} catch (error) {
    $`❌ Error: ${error.message}
    
Make sure the weather server is running: ./samples/tools/start-weather-mcp.sh`
}