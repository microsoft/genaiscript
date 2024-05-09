script({
    title: "azure summarize",
    system: [],
    model: "azure:gpt-4"
})

def("FILE", env.files)

$`
    Summarize each file with one paragraph. 
    Be concise. 
    Answer in plain text.
`
