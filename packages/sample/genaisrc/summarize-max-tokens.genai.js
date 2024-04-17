script({
    title: "summarize with max tokens",
})

def("FILE", env.files, { maxTokens: 20 })

$`Summarize each file. Be concise.`
