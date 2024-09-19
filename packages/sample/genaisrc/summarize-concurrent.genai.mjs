script({
    title: "summarize concurrently",
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/*",
})

const summaries = await Promise.all(
    env.files.map((file) =>
        runPrompt(
            (_) => {
                _.def("FILE", file)
                _.$`Summarize FILE with one paragraph.`
            },
            { label: file.filename }
        )
    )
)

summaries.forEach((s) => def("FILE", s.text))

$`Summarize FILE.`
