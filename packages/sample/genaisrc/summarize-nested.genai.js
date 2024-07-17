script({
    title: "summarize nested",
    model: "openai:gpt-3.5-turbo",
    files: ["src/rag/*"],
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "microsoft", "lorem"],
    },
})

$`Summarize ${def("FILE", env.files)}. This is IMPORTANT.`
