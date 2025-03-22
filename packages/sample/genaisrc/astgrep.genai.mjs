script({
    model: "echo",
    tests: {},
})
const asg = await host.astGrep()
const { matches } = await asg.findFiles("ts", "src/*.mjs", "console.log($META)")

if (matches.length === 0) throw new Error("No matches found")

for (const match of matches) {
    const t = match.text()
    if (!t.includes("console.log")) throw new Error("console.log found")
    console.log(match.text())
}
