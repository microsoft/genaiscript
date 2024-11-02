script({
    model: "small",
    tests: {
        keywords: ["paris", "abracadabra"],
    },
})
const question = "What is the capital of France?"
const hint = () => {
    return "Also add 'abracadabra' to the answer."
}
importTemplate("src/templates/basic.prompty", { question, hint })
