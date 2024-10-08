script({
    model: "openai:gpt-4o-mini",
    cache: "gpt-cache",
    tests: [{}, {}], // run twice to trigger caching
})

const key = Math.random()
const value = Math.random()
for (const cache of [
    await workspace.cache<number, number>("test-cache"),
    await host.cache<number, number>("test-cache"),
]) {
    await cache.set(key, value)
    const result = await cache.get(key)
    if (result !== value) throw new Error(`unexpected value: ${result}`)

    const values = await cache.values()
    if (!values.includes(value)) throw new Error(`unexpected values: ${values}`)

    const keys = await cache.keys()
    if (!keys.includes(key)) throw new Error(`unexpected keys: ${keys}`)
}

console.log(`cache test passed`)

$`Generate 2 word poem.`

defOutputProcessor(async ({ text }) => {
    console.log(`process output`)
    const pcache = await workspace.cache<string, string>("poem-cache")
    const cached = await pcache.get("poem-result")
    const value = "abcdefghijklmnopqrstuvwxyz"
    if (cached) {
        console.log(`cache hit ${cached} | ${value}`)
        if (cached !== value) {
            console.error(`cached value mismatch`)
            throw new Error(
                `unexpected cached value: '${cached}', expected '${value}'`
            )
        }
    } else {
        console.log(`storing poem in cache`)
        await pcache.set("poem-result", value)
    }
})
