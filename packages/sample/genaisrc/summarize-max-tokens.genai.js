script({
    title: "summarize with max tokens",
    model: "openai:gpt-3.5-turbo",
    files: ["src/rag/*"],
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

def("FILE", env.files, { maxTokens: 40 })

$`Extract keywords for the contents of FILE.`
