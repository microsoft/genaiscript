import { init, createDocument, search } from "vectorstore"
script({
    files: "src/rag/*",
    tests: {},
})

await init((args) => process.stderr.write("."))

const docs = await Promise.all(
    env.files
        .filter(({ content }) => content)
        .map((file) => createDocument(file.content, file))
)
const res = await search(
    docs,
    await createDocument("what is markdown?"),
    3,
    "hnsw-wasm"
)

def(
    "FILE",
    res.map((r) => r.doc.metadata)
)
$`Summarize FILE in one short sentence.`
