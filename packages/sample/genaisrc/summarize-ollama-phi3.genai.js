script({
    model: "ollama:phi3",
    title: "summarize with ollama phi3",
    system: [],
    files: "src/rag/markdown.md",
    tests: {
        files: "src/rag/markdown.md",
        keywords: "markdown",
    },
})

const file = def("FILE", env.files)

$`Summarize ${file} in a sentence. 
- Be concise, do not justify or explain yourself.
- Only report summary, do not reply anything else.
`
