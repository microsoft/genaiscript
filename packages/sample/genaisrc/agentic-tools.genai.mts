import { calculator } from "@agentic/calculator"
import { WeatherClient } from "@agentic/weather"

const { question, city } = env.vars
script({
    model: "openai:gpt-35-turbo",
    parameters: {
        question: {
            type: "string",
            default: "How much is 11 + 4? then divide by 3?",
        },
        city: {
            type: "string",
            default: "Paris",
        },
    },
    tests: {
        description: "Testing the default prompt",
        keywords: "5",
    },
})

defTool(calculator)

const weather = new WeatherClient()
const res = await weather.getCurrentWeather({ q: city })
console.log(`weather: ${YAML.stringify(res)}`)
defTool(weather)

$`Answer the following arithmetic question:

    ${question}

Get the weather in ${city}.
`
