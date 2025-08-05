script({
    title: "Weather MCP Configuration Demo",
    description: "Demonstrates using weather MCP server with mcpServers and mcpAgentServers configuration",
    model: "small",
    parameters: {
        cities: {
            type: "string",
            description: "Comma-separated list of cities to check weather for",
            default: "Paris, London, Tokyo"
        },
        useAgent: {
            type: "boolean",
            description: "Whether to use mcpAgentServer (true) or mcpServers (false)",
            default: false
        }
    },
    // Configure MCP servers using mcpServers config
    mcpServers: {
        weather: {
            type: "http",
            url: "http://localhost:3001/mcp"
        }
    },
    // Configure MCP agent servers using mcpAgentServers config
    mcpAgentServers: {
        weatherAgent: {
            type: "http",
            url: "http://localhost:3001/mcp",
            description: "Weather information agent that provides current weather, forecasts, and weather comparisons",
            instructions: "You are a helpful weather assistant. When users ask about weather, use the available tools to get current weather data, forecasts, or compare weather between cities. Always provide detailed and helpful responses with the weather information."
        }
    }
})

// Parse the cities parameter
const cities = (env.vars.cities || "Paris, London, Tokyo")
    .split(",")
    .map(city => city.trim())
    .filter(city => city.length > 0)

const useAgent = env.vars.useAgent === "true" || env.vars.useAgent === true

if (useAgent) {
    $`# Weather Report using MCP Agent Configuration

I will use the weather agent configured via mcpAgentServers to check the weather for the following cities: ${cities.join(", ")}.

The weather agent will handle the tool calls automatically based on my requests.

Please provide a comprehensive weather report for ${cities.join(", ")}, including:
1. Current weather conditions for each city
2. A 3-day forecast for ${cities[0]}
3. A comparison between ${cities[0]} and ${cities[1] || cities[0]}
4. Recommendations for outdoor activities in each city

Format the response in a clear and engaging way with proper sections and formatting.
`
} else {
    $`# Weather Report using MCP Server Configuration

I will check the weather for the following cities using mcpServers configuration: ${cities.join(", ")}.

Let me gather the weather information using the available MCP tools:
`

    // The weather tools are automatically available through mcpServers config
    // Get current weather for each city
    for (const city of cities) {
        $`
## Current Weather in ${city}

Please use the get_current_weather tool to get the current weather for ${city}.
`
    }

    // Get forecast for the first city
    if (cities.length > 0) {
        const firstCity = cities[0]
        $`
## 3-Day Forecast for ${firstCity}

Please use the get_weather_forecast tool to get the 3-day forecast for ${firstCity}.
`
    }

    // Compare weather between first two cities if available
    if (cities.length >= 2) {
        $`
## Weather Comparison

Please use the compare_weather tool to compare the weather between ${cities[0]} and ${cities[1]}.
`
    }

    $`
## Summary

Based on the weather data retrieved from the MCP server, please provide:
1. A brief summary of the current weather conditions
2. Recommendations for outdoor activities in each city
3. Any notable weather patterns or differences between the cities

Please format your response in a clear and engaging way.
`
}