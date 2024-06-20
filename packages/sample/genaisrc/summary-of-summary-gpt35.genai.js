script({
    title: "summary of summary - gp35",
    model: "openai:gpt-3.5-turbo",
    files: ["src/rag/*"],
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

// map each file to its summary
for (const file of env.files) {
    const { text } = await runPrompt(
        (_) => {
            _.def("FILE", file)
            _.$`Summarize FILE. Be concise.`
        },
        { model: "gpt-3.5-turbo", cacheName: "summary_gpt35" }
    )
    // save the summary in the main prompt
    def("FILE", { filename: file.filename, content: text })
}
// reduce all summaries to a single summary
$`Summarize all the FILE.`
