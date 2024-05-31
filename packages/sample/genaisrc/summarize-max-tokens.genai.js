script({
    title: "summarize with max tokens",
    model: "openai:gpt-3.5-turbo",
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

def("FILE", env.files, { maxTokens: 20 })

$`Summarize each file. Be concise.`
