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
const schema = defSchema("KEYWORDS", {
    type: "array",
    items: {
        type: "string",
    },
})
defFileOutput("src/rag/*.summary.md", "The summary of the file")
defFileOutput("src/rag/*.keywords.json", "An array of keywords in the file", {
    schema,
})

$`Summarize each FILE with one paragraph and extract keywords.`
