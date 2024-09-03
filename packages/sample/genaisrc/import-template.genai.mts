script({
    model: "openai:gpt-3.5-turbo",
    tests: {
        keywords: "france",
    },
})
const question = "What is the capital of France?"
importTemplate("src/basic.prompty", { question })
