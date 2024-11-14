script({
    title: "web search search",
})

const webPages = await retrieval.webSearch(
    "what are the last nvidia results?",
    {
        provider: env.vars.provider,
    }
)
console.log(webPages)
def("PAGES", webPages)
$`Summarize pages.`
