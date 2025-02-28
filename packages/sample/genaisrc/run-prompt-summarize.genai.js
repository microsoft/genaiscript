script({
    title: "run prompt summarize",
    model: "small",
    files: "src/rag/*",
    tests: [
        {
            files: ["src/rag/markdown.md"],
            keywords: "markdown",
        },
        {
            files: "src/rag/*",
            keywords: ["markdown", "lorem", "microsoft"],
        },
    ],
})

const tprogress = env.output.startTraceDetails("Progress")
for (const file of env.files) {
    const t = env.output.startTraceDetails(file.filename)
    t.fence(file.content)
    const { text, error } = await runPrompt(
        (_) => {
            _.def("FILE", file, { maxTokens: 4000 })
            _.$`Summarize the FILE. Be concise.`
        },
        {
            model: "small",
        }
    )
    def("FILE", { ...file, content: text })
    t.fence(text)
    t.endDetails()

    tprogress.resultItem(!error, (error + "") || "ok")
}

$`Summarized all files in one paragraph.`
