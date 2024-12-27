script({
    tests: {
        keywords: "sunny",
    },
})
defTool(
    "get_weather",
    "Get the real-time weather information at a given location or city",
    {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and state, e.g. Chicago, IL",
            },
        },
        required: ["location"],
    },
    ({ location }) => {
        return /paris/i.test(location) ? "sunny" : "unknown"
    }
)

$`What is the current weather in Paris?`
