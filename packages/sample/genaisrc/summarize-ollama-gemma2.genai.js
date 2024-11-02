script({
    title: "summarize with ollama gemma 2 2b",
    system: [],
    files: "src/rag/markdown.md",
    tests: {
        files: "src/rag/markdown.md",
        keywords: "markdown",
    },
})

const res = await runPrompt(
    (ctx) => {
        const file = ctx.def("FILE", env.files)
        ctx.$`Summarize ${file} in a sentence. Make it short.`
    },
    {
        model: "ollama:gemma2:2b",
        label: "ollama gemmaa2",
        throwOnError: true,
    }
)
console.log(res.text)
