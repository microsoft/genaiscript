script({
    title: "summarize concurrently",
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/*",
})

const queue = host.promiseQueue({ concurrency: 2 })
const summaries = await queue.mapAll(env.files, (file) =>
    runPrompt(
        (_) => {
            _.def("FILE", file)
            _.$`Summarize FILE with one paragraph.`
        },
        { label: file.filename }
    )
)

summaries.forEach((s) => def("FILE", s.text))

$`Summarize FILE.`
