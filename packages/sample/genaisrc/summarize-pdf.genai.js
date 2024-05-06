script({
    title: "summarize pdf",
    tests: {
        files: "src/rag/loremipsum.pdf",
        keywords: ["lorem", "ipsum", "dolor"],
    },
})

const { file } = await parsers.PDF(env.files[0])

def("FILE", file)

$`Summarize the content of FILE.`
