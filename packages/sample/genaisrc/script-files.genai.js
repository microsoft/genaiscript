script({
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/*.md",
    tests: {},
})

def("FILE", env.files)

$`Summarize FILE.`