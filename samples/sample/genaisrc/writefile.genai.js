script({
    tests: {},
    model: "small",
})
const fn = `temp/${Math.random() + ""}.txt`
const content = JSON.stringify({ val: Math.random() + "" })
await workspace.writeText(fn, content)
const res = await workspace.readText(fn)
if (content !== res.content) throw new Error("file write error")

const jres = await workspace.readJSON(fn)
if (JSON.stringify(jres) !== content) throw new Error("readJSON error")

$`All good!`
