script({
    testModels: [
        "azure_ai_inference:gpt-4o",
        "azure_ai_inference:gpt-4o-mini",
        "azure_ai_inference:o3-mini",
        "azure_ai_inference:deepseek-r1",
    ],
    tests: [{ files: "src/rag/markdown.md", keywords: "markdown" }],
})

const file = def("FILE", env.files)
$`Summarize ${file} in one sentence.`
