script({
    title: "summarize all files",
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/markdown.md",
    tests: [
        {
            files: "src/rag/markdown.md",
            keywords: "markdown",
        },
    ],
})

def("FILE", env.files)
defFileOutput("src/rag/*.summary.md", "The summary of the file")

$`Summarize each FILE with one paragraph.`
