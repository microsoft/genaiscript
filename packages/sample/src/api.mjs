console.log(`loading cli`)
const cli = await import("../../cli/built/genaiscript.cjs")

console.log(cli)
const res = cli.runScript("poem")
console.log(res)
