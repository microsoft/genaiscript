script({
    title: "summarize all files using import",
    model: "small",
    tests: {
        files: ["src/rag/markdown.md"],
        keywords: "markdown",
    },
})

export default async function () {
    def("FILE", env.files)
    $`Summarize each file. Be concise.`
}
