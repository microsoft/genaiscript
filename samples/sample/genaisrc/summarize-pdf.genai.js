script({
    title: "summarize pdf",
    model: "small",
    tests: {
        files: "src/rag/loremipsum.pdf",
        keywords: ["lorem", "ipsum"],
    },
})

const { file } = await parsers.PDF(env.files[0])

def("FILE", file)

$`Summarize the content of FILE.`
