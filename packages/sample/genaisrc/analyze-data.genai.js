script({
    title: "analyze-data",
    tests: [
        {
            description: "penguins",
            files: "src/penguins.csv",
            rubrics: "is a data analysis",
            facts: [
                "The penguin dataset is a collection of images of penguin colonies in Antarctica",
            ],
            keywords: "penguin",
        },
    ],
})

// use def to emit LLM variables
def("FILE", env.files)

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Analyze the data and returns insights.`
