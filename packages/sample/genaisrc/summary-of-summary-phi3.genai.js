script({
    model: "small",
    title: "summary of summary - phi3",
    files: ["src/rag/*.md"],
    tests: {
        files: ["src/rag/*.md"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

// summarize each files individually
for (const file of env.files) {
    const { text } = await runPrompt(
        (_) => {
            _.def("FILE", file)
            _.$`Extract keywords for the contents of FILE.`
        },
        { model: "ollama:phi3", cache: "summary_phi3" }
    )
    def("FILE", { ...file, content: text })
}
// use summary
$`Extract keywords for the contents of FILE.`
