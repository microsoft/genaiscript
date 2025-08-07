// Weather MCP server endpoint
const WEATHER_MCP_URL = "http://localhost:3001/mcp"

script({
    title: "Weather MCP Client Demo",
    description: "Demonstrates using the weather MCP server over HTTP transport",
    model: "small",
    parameters: {
        city: {
            type: "string",
            description: "City to check weather for",
            default: "Paris"
        }
    },
    mcpServers: {
        weather: {
            url: WEATHER_MCP_URL
        }
    }
})

// Access the weather MCP server (configured in script metadata above)
const weather = await host.mcpServer({ id: "weather", url: WEATHER_MCP_URL })

// Get the city parameter
const city = env.vars.city || "Paris"

$`# Weather Report for ${city}

I will check the current weather and forecast for ${city}.
`

// Get current weather
try {
    const currentWeather = await weather.callTool("get_current_weather", { location: city })
    $`
## Current Weather

${currentWeather.text}
`
} catch (error) {
    $`
## Current Weather

❌ Error getting weather data: ${error.message}
`
}

// Get forecast
try {
    const forecast = await weather.callTool("get_weather_forecast", { location: city })
    $`
## 3-Day Forecast

${forecast.text}
`
} catch (error) {
    $`
## 3-Day Forecast

❌ Error getting forecast data: ${error.message}
`
}

$`
## Summary

Based on the weather data retrieved from the MCP server, please provide:
1. A brief summary of the current weather conditions in ${city}
2. Recommendations for outdoor activities
3. Any notable weather patterns for the upcoming days

Please format your response in a clear and engaging way.
`