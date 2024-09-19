import pAll from "p-all"

script({
    title: "summarize concurrently",
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/*",
})

const summaries = await pAll(
    env.files.map(
        (file) => () =>
            runPrompt(
                (_) => {
                    _.def("FILE", file)
                    _.$`Summarize FILE with one paragraph.`
                },
                { label: file.filename }
            )
    ),
    { concurrency: 2 }
)

summaries.forEach((s) => def("FILE", s.text))

$`Summarize FILE.`
