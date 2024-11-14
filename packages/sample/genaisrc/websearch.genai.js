script({
    title: "web search search",
})

const webPages = await retrieval.webSearch("microsoft", {
    provider: env.vars.provider,
})
console.log(webPages)
def("PAGES", webPages, { language: "json" })
$`Summarize pages.`
