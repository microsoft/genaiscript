script({
    title: "summarize with nested arguments",
    model: "openai:gpt-3.5-turbo",
    files: ["src/rag/markdown.md", "src/penguins.csv"],
    tests: [
        {
            files: "src/rag/markdown.md",
            keywords: "markdown",
        },
    ],
})

const data = [
    { a: 1, b: 2 },
    { a: 3, b: 4 },
]

$`Summarize ${env.files[0]} and ${env.files.slice(1)} ${"in"} ${3} ${async () => "sentence"}.
${data}`
