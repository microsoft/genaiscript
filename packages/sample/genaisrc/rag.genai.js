script({
    title: "rag",
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the files.`
def(
    "MARKDOWN",
    (
        await retreival.search("markdown", {
            files: env.files.filter((f) => f.filename.endsWith(".md")),
        })
    ).files
)
def(
    "PDF",
    (
        await retreival.search("lorem ipsum", {
            files: env.files.filter((f) => f.filename.endsWith(".pdf")),
        })
    ).files
)
def(
    "WORD",
    (
        await retreival.search("lorem ipsum", {
            files: env.files.filter((f) => f.filename.endsWith(".docx")),
        })
    ).files
)
def("ALL", (await retreival.search("lorem ipsum")).files)
