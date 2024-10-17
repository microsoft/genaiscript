script({
    title: "summarize links",
    model: "small",
    description: "Given a URL, summarize the contents of the page",
    group: "hello world",
    system: ["system", "system.files"],
    temperature: 0,
    tests: {
        files: "https://raw.githubusercontent.com/microsoft/genaiscript/main/packages/sample/src/rag/markdown.md",
        keywords: "markdown",
    },
})

def("FILE", env.files)
$`Summarize the content of FILE`
