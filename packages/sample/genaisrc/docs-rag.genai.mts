script({
    flexTokens: 12000,
})

const { files, vars } = env
const { question } = vars
if (!question) cancel("Did you mean to ask something?")

// rewrite question for rag
const kw = await runPrompt(
    (_) => {
        _.def("QUESTION", question)
        _.$`You are an external RAG tool. You were given a user query in <QUESTION> and your task is to rewrite it for a vector search. 
        Only return keywords that are relevant to the query. Separate keywords with a space, no punctuation.
        Do not include any other text.`
    },
    {
        model: "small",
        responseType: "text",
        label: "rewrite question",
        cache: true,
    }
)
if (kw.error) cancel(kw.error.message)

// user input
def("FILES", files, { ignoreEmpty: true })

// rag the docs
const docs = await host.fetchText(
    "https://microsoft.github.io/genaiscript/llms-full.txt"
)
if (!docs.ok) cancel("Could not fetch docs")
docs.file.content = docs.file.content.replace(/!\[\]\(\<data:image\/svg\+xml.*?>\)/g, "")

// vector search
const vectorDocs = await retrieval.vectorSearch(kw.text, docs.file, {
    topK: 100,
    minScore: 1,
    embeddingsModel: "ollama:nomic-embed-text",
})
console.debug(`vectorDocs: ${vectorDocs.length}`)
def("DOCS", vectorDocs, { flex: 1, ignoreEmpty: true })
// fuzzy search
const chunks = await MD.chunk(docs.file, { maxTokens: 1000 })
console.debug(`chunks: ${chunks.length}`)
const fuzzDocs = await retrieval.fuzzSearch(kw.text, chunks, {
    topK: 100,
    minScore: 1,
})
console.debug(`fuzzDocs: ${fuzzDocs.length}`)
def("DOCS", fuzzDocs, { flex: 1, ignoreEmpty: true })
def("QUESTION", question)
$`You are an expert at the TypeScript, Node.JS and the GenAIScript script language documented in <DOCS>.`
$`Your task is to implement a GenAIScript script that matches the user request in <QUESTION>.
- Generate TypeScript ESM using async/await.
- Generate comments to explain the code.
- Use the information in <DOCS> to answer the question.
- If the information is not in <DOCS>, say "I don't know".
`
console.log(`cooking`)