script({
    title: "rag",
    tests: {
        files: "src/rag/*",
        // contains
        keywords: ["lorem ipsum", "markdown", "microsoft"],
        rubrics: ["is a summary"],
        facts: ["talks about lorem ipsum"],
    }
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the files.`
def(
    "MARKDOWN",
    (
        await retrieval.search(
            "markdown",
            env.files.filter((f) => f.filename.endsWith(".md"))
        )
    ).files
)
def(
    "PDF",
    (
        await retrieval.search(
            "lorem ipsum",
            env.files.filter((f) => f.filename.endsWith(".pdf"))
        )
    ).files
)
def(
    "WORD",
    (
        await retrieval.search(
            "lorem ipsum",
            env.files.filter((f) => f.filename.endsWith(".docx"))
        )
    ).files
)
def("ALL", (await retrieval.search("lorem ipsum", env.files)).files)
