script({
    system: [],
    files: ["src/azure-lza/azure-azure-resource-manager-bicep.pdf"],
})

const doc = env.files[0]
const chunks = splitTextIntoChunks(doc.content, 100)

console.log(
    `Document: ${doc.filename}, ${doc.content.length} characters, ${chunks.length} chunks`
)
for (const chunk of chunks) {
    console.log(`chunk: ${chunk.slice(0, 25) + "..."}`)
    const res = await runPrompt(
        (_) => {
            _.def("DOCUMENT", doc, { maxTokens: 10000 })
            $`Here is the chunk we want to situate within the whole document`
            _.def("CHUNK", chunk)
            _.$`Please give a short succinct context to situate this chunk 
within the overall document for the purposes of improving search retrieval of the chunk.
Answer only with the succinct context and nothing else. `
        },
        { cache: "cr" }
    )
}

function splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const tokens = text.split(/\s+/) // Split text into tokens based on whitespace
    const chunks = []
    for (let i = 0; i < tokens.length; i += chunkSize) {
        chunks.push(tokens.slice(i, i + chunkSize).join(" "))
    }
    return chunks
}
