script({
    model: "small",
    tests: {
        keywords: "paris",
    },
})

const res = await runPrompt((ctx) => {
    ctx.importTemplate("src/basic.prompty", {
        question: "what is the capital of france?",
        hint: "starts with p",
    })
})
console.log(`inline: ${res.text}`)

importTemplate("src/basic.prompty", {
    question: "what is the capital of france?",
    hint: "starts with p",
})
