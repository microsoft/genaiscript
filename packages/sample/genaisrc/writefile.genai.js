script({
    tests: {},
    model: "openai:gpt-3.5-turbo",
})
const fn = `temp/${Math.random() + ""}.txt`
const content = Math.random() + ""
await workspace.writeText(fn, content)
const res = await workspace.readText(fn)
if (content !== res.content) throw new Error("file write error")

$`All good!`
