script({
    model: "small",
    tests: {
        keywords: "paris",
    },
})

importTemplate("src/basic.prompty", {
    question: "what is the capital of france?",
    hint: "starts with p",
})
