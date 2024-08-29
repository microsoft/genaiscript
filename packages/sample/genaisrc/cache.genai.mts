script({
    model: "openai:gpt-3.5-turbo",
    cache: true,
    cacheName: "gpt-cache",
    tests: [{}, {}], // run twice to trigger caching
})

const cache = await workspace.cache<number, number>("test-cache")
const key = Math.random()
const value = Math.random()

await cache.set(key, value)
const result = await cache.get(key)
if (result !== value) throw new Error(`unexpected value: ${result}`)

const values = await cache.values()
if (!values.includes(value)) throw new Error(`unexpected values: ${values}`)

const keys = await cache.keys()
if (!keys.includes(key)) throw new Error(`unexpected keys: ${keys}`)

console.log(`cache test passed`)

$`Generate a random word.`

defOutputProcessor(async ({ text }) => {
    console.error(`process output`)
    const pcache = await workspace.cache<string, string>("poem-cache")
    const cached = await pcache.get("poem-result")
    if (cached) {
        console.error(`cache hit ${cached} | ${text}`)
        if (cached !== text) {
            console.error(`cached value mismatch`)
            throw new Error(`unexpected cached value: ${cached}`)
        }
    } else {
        console.error(`storing poem in cache`)
        await pcache.set("poem-result", text)
    }
})
