script({
    title: "analyze-data",
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Analyze the data and returns insights.`

// use def to emit LLM variables
def("FILE", env.files)
