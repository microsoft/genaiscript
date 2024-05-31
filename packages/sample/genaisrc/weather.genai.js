script({
    model: "openai:gpt-3.5-turbo",
    title: "Weather as function",
    description:
        "Query the weather for each city using a dummy weather function",
    temperature: 0.5,
    files: "src/cities.md",
    tests: {
        files: "src/cities.md",
        keywords: "Brussels",
    },
})

$`Query the weather for each listed city and return the results as a table.`

def("CITIES", env.files)

defTool(
    "get_current_weather",
    "get the current weather",
    {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA",
            },
        },
        required: ["location"],
    },
    (args) => {
        const { context, location } = args
        const { trace } = context

        trace.log(`Getting weather for ${location}...`)

        let content = "variable"
        if (location === "Brussels") content = "sunny"

        return content
    }
)
