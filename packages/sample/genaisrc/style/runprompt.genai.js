script({
    model: "openai:gpt-3.5-turbo",
    tests: {}
})

const res = await runPrompt(_ => {
    _.$`generate 3 random numbers between 1 and 10 and respond in JSON`
}, {
    model: "openai:gpt-3.5-turbo",
    label: "Is this JSON?",
    responseType: "json_object",
    system: ["system", "system.zero_shot_cot"]
})

$`Is this JSON?

${res.text}`