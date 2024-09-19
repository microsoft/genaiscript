script({
    title: "summarize with nested arguments",
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/markdown.md",
    tests: [
        {
            files: "src/rag/markdown.md",
            keywords: "markdown",
        },
    ],
})

$`Summarize ${env.files}.`
