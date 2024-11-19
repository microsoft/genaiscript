script({
    title: "summarize all files",
    model: "small",
    files: "src/rag/markdown.md",
    tests: [
        {
            files: "src/rag/markdown.md",
            keywords: "markdown",
        },
    ],
})

def("FILE", env.files)

$`
Summarize all files in FILE in a single paragraph.
- Keep it short.
- At most 3 paragraphs.
- Consider all files at once, do NOT summarize files individually.
`
