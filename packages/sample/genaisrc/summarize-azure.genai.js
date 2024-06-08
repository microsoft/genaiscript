script({
    title: "summarize azure",
    model: "azure:gpt2networkverification",
    files: "src/rag/markdown.md",
})

def("FILE", env.files)

$`
Summarize each FILE with one paragraph.
- Do not wrap results in code section.
- Use less than 20 words.
`
