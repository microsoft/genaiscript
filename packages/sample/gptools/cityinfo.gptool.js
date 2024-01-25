gptool({
    title: "City general information",
    description: "Generate a JSON response with city size information.",
    temperature: 0
})

// JSON schema to constrain the output of the tool.
defSchema("CITY_SCHEMA", {
    type: "array",
    description: "A list of cities with population and elevation information.",
    items: {
        type: "object",
        description: "A city with population and elevation information.",
        properties: {
            name: { type: "string", description: "The name of the city." },
            population: { type: "number", description: "The population of the city." },
            elevation: { type: "number", description: "The elevation of the city." },
            url: { type: "string", description: "The URL of the city's Wikipedia page." }
        },
        required: ["name", "population", "elevation", "url"]
    }
})

// the data to analyze
def("CITIES", env.files)

// the task
$`Generate a YAML data file with the information of the cities in the CITIES data set,
compliant with the CITY_SCHEMA JSON schema.
`
