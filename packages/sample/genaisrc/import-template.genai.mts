script({
    model: "openai:gpt-3.5-turbo",
    tests: {
        keywords: ["paris", "abracadabra"],
    },
})
const question = "What is the capital of France?"
const hint = () => {
    return "Also add 'abracadabra' to the answer."
}
importTemplate("src/basic.prompty", { question, hint })
