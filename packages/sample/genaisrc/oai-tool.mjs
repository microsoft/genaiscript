import OpenAI from "openai"
import "dotenv/config"

const openai = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
})

async function main() {
    const messages = [
        {
            role: "user",
            content: "What's the weather like in Chicago today? Use tools.",
        },
    ]
    const tools = [
        {
            type: "function",
            function: {
                name: "get_weather",
                description: "Get the weather in a given location",
                parameters: {
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
            },
        },
    ]

    let response = await openai.chat.completions.create({
        model: "gemini-1.5-flash",
        messages: messages,
        tools: tools,
        tool_choice: "auto",
    })

    messages.push(response["choices"][0]["message"])
    console.log(JSON.stringify(messages.at(-1), null, 2))
    messages.push({
        role: "tool",
        content: JSON.stringify({
            temperature: 70,
        }),
        tool_call_id: response["choices"][0]["message"]["tool_calls"][0]["id"],
    })
    console.log(JSON.stringify(messages.at(-1), null, 2))
    response = await openai.chat.completions.create({
        model: "gemini-1.5-flash",
        messages: response,
        tools: tools,
        tool_choice: "auto",
    })
    messages.push(response["choices"][0]["message"])
    console.log(JSON.stringify(messages.at(-1), null, 2))
}

main()
