script({
    files: "src/rag/loremipsum.pdf",
    tests: {},
})

const chunks = await tokenizers.chunk(env.files[0], {
    chunkSize: 256,
    chunkOverlap: 42,
    lineNumbers: true,
})

let summary = ""
for (const chunk of chunks) {
    const { text } = await runPrompt(
        (ctx) => {
            ctx.def("CHUNK", chunk)
            ctx.def("SUMMARY_SO_FAR", summary, { ignoreEmpty: true })
            ctx.$`Summarize CHUNK. Use SUMMARY_SO_FAR as a starting point (but do not repeat it).`
        },
        { model: "small", system: ["system"] }
    )
    summary = text
}

console.log(summary)
