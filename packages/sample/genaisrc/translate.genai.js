script({
    system: ["system", "system.files"],
    files: "src/xpai/*.txt",
    tests: {
        files: "src/xpai/*.txt",
    },
})
const lang = env.vars.lang || "French"

for (const file of env.files) {
    const canary = Math.random().toString(36).substring(7)
    const res = await runPrompt((_) => {
        _.$`Respond with ${canary}.`
        _.def("FILE", file)
    })
    console.log(res.text)
    if (res.text !== canary) {
        cancel("file contains adverse content")
    }
}

def("FILE", env.files)
$`Translate the text in FILE to ${lang}`
