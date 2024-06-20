script({
    model: "openai:gpt-3.5-turbo",
    tests: {}
})

const res = await runPrompt(_ => {
    _.$`generate 3 random numbers between 1 and 10 and respond in JSON`
}, {
    model: "openai:gpt-3.5-turbo",
    responseType: "json_object"
})

$`Is this JSON?

${res.text}`