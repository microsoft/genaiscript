script({
    model: "openai:gpt-3.5-turbo",
    tests: {}
})

const resPoem = await runPrompt(_ => {
    _.$`write haiku poem`
}, {
    model: "openai:gpt-3.5-turbo",
    label: "generate poem",
    system: ["system"]
})

const resJSON = await runPrompt(_ => {
    _.$`generate 3 random numbers between 1 and 10 and respond in JSON`
}, {
    model: "openai:gpt-3.5-turbo",
    label: "generate json",
    responseType: "json_object",
})

$`Is this poetry? Respond yes or no.`
fence(resPoem.text)

$`Is this JSON? Respond yes or no.`
fence(resJSON.text)

