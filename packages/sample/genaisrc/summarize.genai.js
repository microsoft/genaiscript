script({
    title:"summarize all files",
    system: []
})

def("FILE", env.files)

$`Summarize each file with one paragraph. Be concise. Answer in plain text.`