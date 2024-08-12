script({
    title: "summarize-gpt4",
    model: "openai:gpt-4",
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
Summarize each FILE with one paragraph.
- Do not wrap results in code section.
- Use less than 20 words.
`
