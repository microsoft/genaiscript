gptool({
    title: 'Weather as function',
    description: 'Query the weather for each city using a dummy weather function',
    temperature: 0.5
})

$`Query the weather for each listed city and return the results as a table.`

def("CITIES", env.file)

defFunction('get_current_weather', 'get the current weather', {
    "type": "object",
    "properties": {
        "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA",
        },
    },
    "required": ["location"],
}, (args) => {
    const { context, location } = args
    const { trace, output } = context

    trace.log(`Getting weather for ${location}...`)

    let r = "variable"
    if (location === "Brussels") r = "sunny"

    output.log(`The weather in ${location} is ${r}`)

    return r
})