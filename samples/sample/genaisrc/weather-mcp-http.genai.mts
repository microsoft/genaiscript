// Weather MCP server endpoint
const WEATHER_MCP_URL = "http://localhost:3001/mcp"

script({
    title: "Weather MCP Client Demo",
    description: "Demonstrates using the weather MCP server over HTTP transport",
    model: "small",
    parameters: {
        cities: {
            type: "string",
            description: "Comma-separated list of cities to check weather for",
            default: "Paris, London, Tokyo"
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

// Parse the cities parameter
const cities = (env.vars.cities || "Paris, London, Tokyo")
    .split(",")
    .map(city => city.trim())
    .filter(city => city.length > 0)

$`# Weather Report

I will check the current weather for the following cities: ${cities.join(", ")}.

Let me gather the weather information for each city:
`

// Get current weather for each city
for (const city of cities) {
    try {
        const currentWeather = await weather.callTool("get_current_weather", { location: city })
        $`
## Weather in ${city}

${currentWeather.text}
`
    } catch (error) {
        $`
## Weather in ${city}

❌ Error getting weather data: ${error.message}
`
    }
}

// Get forecast for the first city
if (cities.length > 0) {
    const firstCity = cities[0]
    try {
        const forecast = await weather.callTool("get_weather_forecast", { location: firstCity })
        $`
## 3-Day Forecast for ${firstCity}

${forecast.text}
`
    } catch (error) {
        $`
## 3-Day Forecast for ${firstCity}

❌ Error getting forecast data: ${error.message}
`
    }
}

// Compare weather between first two cities if available
if (cities.length >= 2) {
    try {
        const comparison = await weather.callTool("compare_weather", { 
            city1: cities[0], 
            city2: cities[1] 
        })
        $`
## Weather Comparison

${comparison.text}
`
    } catch (error) {
        $`
## Weather Comparison

❌ Error comparing weather data: ${error.message}
`
    }
}

$`
## Summary

Based on the weather data retrieved from the MCP server, please provide:
1. A brief summary of the current weather conditions
2. Recommendations for outdoor activities in each city
3. Any notable weather patterns or differences between the cities

Please format your response in a clear and engaging way.
`