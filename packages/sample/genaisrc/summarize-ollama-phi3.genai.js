script({
    model: "ollama:phi3",
    title:"summarize with ollama phi3"
})

def("FILE", env.files)

$`Summarize each file. Be concise.`