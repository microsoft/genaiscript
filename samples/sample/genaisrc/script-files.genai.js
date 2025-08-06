script({
    model: "small",
    files: "src/rag/*.md",
    tests: {},
})

def("FILE", env.files)

$`Summarize FILE.`