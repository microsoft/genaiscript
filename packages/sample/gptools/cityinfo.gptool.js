gptool({
    title: "City info",
    system: ["system.json"]
})

$`For each city in the CITIES, provide the following information:

- The city's population
- The city's elevation

Format it as an array.
`

def("CITIES", env.file)