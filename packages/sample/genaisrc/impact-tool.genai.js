script({
    title: "Impact tool",
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
    await retreival.query("what is the story behind lorem ipsum?", {
        files: env.files.filter((f) => f.filename.endsWith(".pdf")),
    })
)
def("WORD", (await retreival.search("word")).files)
