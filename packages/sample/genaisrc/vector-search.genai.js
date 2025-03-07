script({
    model: "ollama:phi3",
    files: "src/rag/*",
    tests: {
        files: "src/rag/*",
        keywords: ["lorem"],
    },
})

def("FILES", await retrieval.vectorSearch("lorem", env.files))

$`Summarize FILES. Use one short sentence.`
