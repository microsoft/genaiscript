script({
    tests: {},
})

// JSON schema to constrain the output of the tool.
const schema = defSchema("CITY_SCHEMA", {
    type: "array",
    description: "A list of cities with population and elevation information.",
    items: {
        type: "object",
        description: "A city with population and elevation information.",
        properties: {
            name: { type: "string", description: "The name of the city." },
            population: {
                type: "number",
                description: "The population of the city.",
            },
            url: {
                type: "string",
                description: "The URL of the city's Wikipedia page.",
            },
        },
        required: ["name", "population", "url"],
    },
})

$`Give 5 cities with their populations in YAML using the ${schema} schema.`
