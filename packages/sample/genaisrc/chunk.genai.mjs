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
            ctx.$`Summarize the content in CHUNK. Use the content in SUMMARY_SO_FAR as a starting point (but do not repeat it). Answer in plain text.`.role(
                "system"
            )
            ctx.def("CHUNK", chunk, { lineNumbers: false })
            ctx.def("SUMMARY_SO_FAR", summary, {
                ignoreEmpty: true,
                lineNumbers: false,
            })
        },
        {
            model: "small",
            label: chunk.content.slice(0, 42) + "...",
        }
    )
    summary = text
}

console.log(summary)
