gptool({
    title: "City general information",
    description: "Generate a JSON response with city size information.",
    system: ["system.json"]
})

$`For each city in the CITIES, provide the following information:

- The city's population
- The city's elevation

If the city is unknown, omit it from the response.
`

def("EXAMPLE", JSON.stringify({
    "madrid": {
        "population": 3223334,
        "elevation": 667
    },
    "london": {
        "population": 8908081,
        "elevation": 24
    },
}), { language: "json" })

def("CITIES", env.file)