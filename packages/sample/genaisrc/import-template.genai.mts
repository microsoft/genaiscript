script({
    model: "small",
    tests: {
        keywords: ["paris", "berlin"],
    },
})
const question = "- What is the capital of France?"
const hint = () => {
    return "- What is the capital of Germinay"
}
importTemplate("src/templates/basic.prompty", { question, hint, n: 5 })
