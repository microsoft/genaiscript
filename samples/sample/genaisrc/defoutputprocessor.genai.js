script({
    model: "small",
    title: "custom output",
    files: "src/rag/markdown.md", tests: { files: "src/rag/markdown.md" },
    system: [],
})
const output = env.files[0].filename + ".txt"
def("FILE", env.files)
$`Summarize all the files. Respond as raw text.`

defOutputProcessor(async (o) => {
    console.log(`writing to ${output}`)
    return {
        files: {
            [output]: o.text,
        },
    }
})

defOutputProcessor(o => {
    const { text } = o
    console.log(`doing something with text`)
    console.log(text)
})