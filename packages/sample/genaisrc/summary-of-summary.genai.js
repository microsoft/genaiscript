script({
    title: "summary of summary",
})

// summarize each files individually
for (const file of env.files) {
    const { text } = await runPrompt(
        (_) => {
            _.def("FILE", file)
            _.$`Summarize the FILE. Be consice.`
        },
        { model: "gpt-3.5-turbo", cacheName: "summary_gpt35" }
    )
    def("FILE", { ...file, content: text })
}
// use summary
$`Summarize all the FILE.`
