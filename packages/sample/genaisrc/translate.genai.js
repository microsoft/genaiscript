script({
    system: ["system", "system.files"],
    files: "src/xpai/*.txt",
    tests: {
        files: "src/xpai/*.txt"
    },
})
const lang = env.vars.lang || "French"
def("FILE", env.files)

$`Translate the text in FILE to ${lang}`
