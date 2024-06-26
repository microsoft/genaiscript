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

$`Summarize ${file} in a single sentence in plaintext with less than 7 words.

- Do not justify why you used more words.`
