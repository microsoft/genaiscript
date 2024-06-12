script({
    model: "openai:gpt-4-32k",
    title: "summary of summary - phi3",
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    }
})

// summarize each files individually
for (const file of env.files) {
    const { text } = await runPrompt(
        (_) => {
            _.def("FILE", file)
            _.$`Summarize the FILE and respond in plain text with one paragraph. Be consice. Ensure that summary is consistent with the content of FILE.`
        },
        { model: "ollama:phi3", cacheName: "summary_phi3" }
    )
    def("FILE", { ...file, content: text })
}
// use summary
$`Summarize all the FILE.`
