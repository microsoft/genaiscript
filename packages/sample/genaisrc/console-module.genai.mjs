script({
    tests: {},
})

console.log("log")
console.warn(`warn`)
console.error(`error`)

try {
    throw new Error(`error`)
} catch(e) {
    console.error(e)
}

await runPrompt(
    (_) => {
        _.console.log("prompt.log")
        _.console.warn("prompt.warn")
        _.console.error("prompt.error")
        _.$`write a movie title`
    },
    { label: "inner prompt", model: "small" }
)

console.log(`after run prompt`)

$`write a poem of 2 verse.`
