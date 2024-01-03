gptool({
    title: "City info",
    system: ["system.json"]
})

$`For each city in the CITIES, provide the following information:

- The city's population
- The city's elevation

Example:
`

fence(JSON.stringify({
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