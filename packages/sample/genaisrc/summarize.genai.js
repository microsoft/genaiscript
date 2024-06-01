script({
    title: "summarize all files",
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/markdown.md",
    tests: [
        {
            files: "src/rag/markdown.md",
            facts: ["Markdown is a text-based syntax to generate documents"],
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
