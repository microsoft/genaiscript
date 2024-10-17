script({
    title: "summarize nested",
    model: "small",
    files: ["src/rag/*"],
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "microsoft", "lorem"],
    },
})

$`Summarize ${def("FILE", env.files)}. This is IMPORTANT.`
