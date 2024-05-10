script({
    title: "summarize all files",
    system: [],
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

- Be concise. 
- Answer in plain text.
- Use less than 20 words.
`
