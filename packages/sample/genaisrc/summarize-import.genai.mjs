script({
    title: "summarize all files using import",
    model: "openai:gpt-3.5-turbo",
    tests: {
        files: ["src/rag/markdown.md"],
        keywords: "markdown",
    },
})

export default async function () {
    def("FILE", env.files)
    $`Summarize each file. Be concise.`
}
