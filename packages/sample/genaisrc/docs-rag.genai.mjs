script({})

const { files, vars } = env
const { question } = vars
if (!question) cancel("Did you mean to ask something?")

// rewrite question for rag
const kw = await runPrompt(
    (_) => {
        _.def("QUESTION", question)
        _.$`You are an external RAG tool. You were given a user query in <QUESTION> and your task is to rewrite it for a vector search.`
    },
    {
        model: "small",
        responseType: "text",
    }
)
if (kw.error) cancel(kw.error.message)

// rag the docs
const docs = await host.fetchText(
    "https://microsoft.github.io/genaiscript/llms-full.txt"
)
if (!docs.ok) cancel("Could not fetch docs")
const docsRaged = await retrieval.vectorSearch(kw.text, docs.file, {
    topK: 100,
})

def("FILES", files, { ignoreEmpty: true })
def("DOCS", docsRaged, { maxTokens: 12000 })
def("QUESTION", question)
$`Implement the user request in <QUESTION>.
- Use the information in <DOCS> to answer the question.
- If the information is not in <DOCS>, say "I don't know".`
