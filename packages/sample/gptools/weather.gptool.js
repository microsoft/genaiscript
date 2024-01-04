gptool({
    title: 'Weather function',
    description: 'Register a function to query the weather',
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
        "format": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "description": "The temperature unit to use. Infer this from the users location.",
        },
    },
    "required": ["location", "format"],
}, (args) => {
    const { location, format } = args
    return `${location} ${format}`
})