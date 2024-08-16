script({
    title: "rag",
    model: "ollama:phi3",
    files: "src/rag/*",
    tests: {
        files: "src/rag/*",
        keywords: ["lorem", "markdown", "word"],
    },
})

$`Summarize MARKDOWN, PDF, WORD and ALL. Use one short sentence.`

const embeddingsModel = env.vars.embeddingsModel || "ollama:nomic-embed-text"

def(
    "MARKDOWN",
    await retrieval.vectorSearch(
        "markdown",
        env.files.filter((f) => f.filename.endsWith(".md")),
        { embeddingsModel }
    )
)
def(
    "PDF",
    await retrieval.vectorSearch(
        "lorem",
        env.files.filter((f) => f.filename.endsWith(".pdf")),
        { embeddingsModel }
    )
)
def(
    "WORD",
    await retrieval.vectorSearch(
        "word",
        env.files.filter((f) => f.filename.endsWith(".docx")),
        { embeddingsModel }
    )
)
def(
    "ALL",
    await retrieval.vectorSearch("lorem", env.files, {
        embeddingsModel,
    })
)
