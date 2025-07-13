script({
    model: "small",
    tests: {},
})

console.log("log")
console.warn(`warn`)
console.error(`error`)

await runPrompt((_) => {
    _.console.log("prompt.log")
    _.console.warn("prompt.warn")
    _.console.error("prompt.error")
    _.$`write a movie title`
}, { label: "inner prompt"})

console.log(`after run prompt`)

$`write a poem of 2 verse.`
