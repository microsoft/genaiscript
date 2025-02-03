script({
    model: "ollama:llama3.2:1b",
    fallbackTools: true,
})

defTool(
    "weather",
    "gets the real time weather information in a city",
    {
        type: "object",
        properties: { city: { type: "string" } },
        required: ["city"],
    },
    async ({ city }) => {
        if (/seattle/i.test(city)) return "rainy"
        return "unkonwn"
    }
)

$`What is the current weather in Seattle? Do not generate python. Use tools.`
