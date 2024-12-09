console.log(`loading cli`)
const api = await import("../../cli/built/genaiscript.cjs")

console.log(api)
const res = await api.run("poem")

console.log(res)
