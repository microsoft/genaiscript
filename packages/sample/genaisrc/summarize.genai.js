script({
    title: "summarize all files",
    system: [],
    tests: [
        {
            files: "src/rag/markdown.md",
            rubrics: "is a summary",
            facts: ["Markdown is a text-based syntax to generate documents"],
            keywords: "markdown"
        },
    ],
})

def("FILE", env.files)

$`
    Summarize each file with one paragraph. 
    Be concise. 
    Answer in plain text.
`
