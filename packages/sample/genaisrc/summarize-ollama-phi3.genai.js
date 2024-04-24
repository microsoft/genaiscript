script({
    model: "ollama:llama3",
    title:"summarize with ollama gemma",
    system: ["system"]
})

const file = def("FILE", env.files)

$`Summarize ${file} in a single paragraph.`