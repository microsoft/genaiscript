script({
    title: "rag",
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/*",
    tests: {
        files: "src/rag/*",
        keywords: ["lorem", "markdown", "word"],
    },
})

$`You are a helpful assistant. Summarize the files in MARKDOWN, PDF, WORD and ALL.`

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
