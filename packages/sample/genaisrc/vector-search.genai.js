script({
    model: "openai:gpt-3.5-turbo",
    files: "src/rag/*",
    tests: {
        files: "src/rag/*",
        keywords: ["lorem"],
    },
})

const embeddingsModel = env.vars.embeddingsModel || "ollama:nomic-embed-text"
def(
    "FILES",
    await retrieval.vectorSearch("lorem", env.files, {
        embeddingsModel,
    })
)

$`Summarize FILES. Use one short sentence.`
