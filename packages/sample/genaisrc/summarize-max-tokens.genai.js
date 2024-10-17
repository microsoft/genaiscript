script({
    title: "summarize with max tokens",
    model: "small",
    files: ["src/rag/*"],
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

def("FILE", env.files, { maxTokens: 80 })

$`Extract 5 keywords for the contents of FILE.`
