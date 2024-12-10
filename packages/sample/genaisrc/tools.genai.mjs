script({
    tests: {
        keywords: "sunny",
    },
})
defTool(
    "get_weather",
    "Get the current weather in a given location",
    {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and state, e.g. Chicago, IL",
            },
            unit: {
                type: "string",
                enum: ["celsius", "fahrenheit"],
            },
        },
        required: ["location"],
    },
    ({ location, unit }) => {
        return location === "Paris" ? "sunny" : "unknown"
    }
)

$`What is the current weather in Paris?`
