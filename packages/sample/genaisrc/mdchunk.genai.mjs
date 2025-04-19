script({
    files: "src/rag/markdown.md",
})

const chunks = await MD.chunk(env.files[0], { maxTokens: 50 })
for (const chunk of chunks) {
    console.log({ chunk })
}
