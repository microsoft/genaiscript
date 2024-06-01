script({
    title: "summarize pdf",
    model: "openai:gpt-3.5-turbo",
    tests: {
        files: "src/rag/loremipsum.pdf",
        keywords: ["lorem", "ipsum"],
    },
})

const { file } = await parsers.PDF(env.files[0])

def("FILE", file)

$`Summarize the content of FILE.`
