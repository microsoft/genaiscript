gptool({
    title: "City general information",
    description: "Generate a JSON response with city size information.",
    system: ["system", "system.schema"]
})

$`For each city in the CITIES, provide the following information:

- The city's population.
- The city's elevation.

If the city is unknown, omit it from the response.
Validate the output the generated YAML using the CITY_SCHEMA JSON schema.
`

defSchema("CITY_SCHEMA", {
    type: "array",
    description: "A list of cities with population and elevation information.",
    items: {
        type: "object",
        description: "A city with population and elevation information.",
        properties: {
            name: { type: "string", description: "The name of the city." },
            population: { type: "number", description: "The population of the city." },
            elevation: { type: "number", description: "The elevation of the city." }
        },
        required: ["name", "population", "elevation"]
    }
})

def("CITIES", env.file)