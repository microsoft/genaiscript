script({
    model: "ollama:gemma2:2b",
    title: "summarize with ollama gemma 2 2b",
    system: [],
    files: "src/rag/markdown.md",
    tests: {
        files: "src/rag/markdown.md",
        keywords: "markdown",
    },
})

const file = def("FILE", env.files)

$`Summarize ${file} in a sentence. Make it short.
`
