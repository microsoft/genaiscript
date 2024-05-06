script({
    title: "summarize with max tokens",
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

def("FILE", env.files, { maxTokens: 20 })

$`Summarize each file. Be concise.`
