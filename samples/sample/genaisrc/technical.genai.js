script({
    title: "Technical proofreading",
    description: "Reviews the text as a tech writer.",
    group: "documentation",
    system: ["system.files", "system.technical"],
    temperature: 0,
    files: "src/rag/markdown.md",
    tests: {
        files: "src/rag/markdown.md",
    },
})

def("FILE", env.files)

$`You are a helpful expert writer at technical documentation.
You are reviewing and updating FILE to fix grammatical errors, 
fix spelling errors and make it sound technical.`
