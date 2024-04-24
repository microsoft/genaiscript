script({
    model: "ollama:phi3",
    title:"summarize with ollama phi3",
    system: ["system"]
})

const file = def("FILE", env.files)

$`Summarize ${file} in a single paragraph.`