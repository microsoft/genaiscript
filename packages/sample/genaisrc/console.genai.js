script({
    model: "openai:gpt-3.5-turbo",
    tests: {},
})

await runPrompt((_) => {
    _.console.log("prompt.log")
    _.console.warn("prompt.warn")
    _.console.error("prompt.error")
    _.$`write a movie title`
})

console.log("log")
console.warn(`warn`)
console.error(`error`)
$`write a poem`
