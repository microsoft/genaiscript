script({
    title: "summarize nested",
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "microsoft", "lorem"],
    },
})

$`Summarize ${def("FILE", env.files)}. Be concise.`
