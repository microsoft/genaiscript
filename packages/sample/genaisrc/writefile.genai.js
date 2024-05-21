script({
    tests: {},
})
const fn = `temp/${Math.random() + ""}.txt`
const content = Math.random() + ""
await workspace.writeText(fn, content)
const res = await workspace.readText(fn)
if (content !== res.content) throw new Error("file write error")

$`All good!`
