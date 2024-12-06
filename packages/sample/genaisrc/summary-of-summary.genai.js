script({
    model: "small",
    files: "src/rag/*",
    tests: {
        files: ["src/rag/*"],
        keywords: ["markdown", "lorem", "microsoft"],
    },
})

if (!env.files.length) throw new Error("No files found")
// summarize each files individually
for (const file of env.files) {
    const { text } = await runPrompt(
        (_) => {
            _.def("FILE", file)
            _.$`Extract keywords for the contents of FILE.`
        },
        { model: "small", cache: "summary_summary" }
    )
    def("FILE", { ...file, content: text })
}
// use summary
$`Extract keywords for the contents of FILE.`
