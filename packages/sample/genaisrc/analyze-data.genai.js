script({
    title: "analyze-data",
    model: "openai:gpt-3.5-turbo",
    tests: [
        {
            description: "penguins csv",
            files: "src/penguins.csv",
            keywords: "penguin",
        },
        {
            description: "penguins xlsx",
            files: "src/penguins.xlsx",
            keywords: "penguin",
        },
    ],
})

// use def to emit LLM variables
def("FILE", env.files)

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Analyze the data and returns insights.`
