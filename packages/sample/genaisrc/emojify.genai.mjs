script({
    title: "summarize to emoji",
    model: "large",
    files: "src/rag/markdown.md",
    accept: ".txt,.pdf,.md,.ts,.prompty",
    tests: [
        {
            files: "src/rag/markdown.md",
            keywords: "markdown",
        },
    ],
})

env.output.heading(3, `original`)
env.output.fence(env.files[0].content, "md")

def("FILE", env.files)
$`Compress the content of <FILE> using emojis.
Make the compression as losssless as possible.`

defOutputProcessor(async ({ text }) => {
    const res = await runPrompt((_) => {
        _.def("FILE", parsers.unfence(text, "markdown"))
        _.$`Decompress the content of <FILE> by replacing emojis with their textual representation.
        Only respond with the decompressed text.`
    })

    env.output.heading(3, `decompressed`)
    env.output.fence(res.text, "md")
    return { text: res.text }
})
