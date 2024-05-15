script({
    responseSchema: {
        type: "array",
        description:
            "A list of cities with population and elevation information.",
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
    },
})
// the data to analyze
def("CITIES", env.files)

// the task`
$`Answer with a JSON array with the information of the cities in the CITIES data set.`
