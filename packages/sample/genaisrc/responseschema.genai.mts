script({
    model: "small",
    tests: {},
    responseSchema: {
        type: "object",
        properties: {
            cities: {
                type: "array",
                description:
                    "A list of cities with population and elevation information.",
                items: {
                    type: "object",
                    description:
                        "A city with population and elevation information.",
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the city.",
                        },
                        population: {
                            type: "number",
                            description: "The population of the city.",
                        },
                        url: {
                            type: "string",
                            description:
                                "The URL of the city's Wikipedia page.",
                        },
                    },
                    required: ["name", "population", "url"],
                },
            },
        },
    },
})

for (const responseType of ["yaml", "json", "json_object", "json_schema"]) {
    const res = await runPrompt("Generate 5 cities with their populations", {
        responseType: responseType as any,
        responseSchema: {
            type: "object",
            properties: {
                cities: {
                    type: "array",
                    description:
                        "A list of cities with population and elevation information.",
                    items: {
                        type: "object",
                        description:
                            "A city with population and elevation information.",
                        properties: {
                            name: {
                                type: "string",
                                description: "The name of the city.",
                            },
                            population: {
                                type: "number",
                                description: "The population of the city.",
                            },
                            url: {
                                type: "string",
                                description:
                                    "The URL of the city's Wikipedia page.",
                            },
                        },
                        required: ["name", "population", "url"],
                    },
                },
            },
        },
    })
    console.log(res.json)
}

$`Generate 5 cities with their populations.`
