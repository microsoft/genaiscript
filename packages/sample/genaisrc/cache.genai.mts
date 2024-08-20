script({
    model: "openai:gpt-3.5-turbo",
    tests: {},
})

const cache = await workspace.cache<number, number>("test-cache")
const key = Math.random()
const value = Math.random()

await cache.set(key, value)
const result = await cache.get(key)
if (result !== value) throw new Error(`unexpected value: ${result}`)

const values = await cache.values()
if (!values.includes(value)) throw new Error(`unexpected values: ${values}`)

console.log(`cache test passed`)
