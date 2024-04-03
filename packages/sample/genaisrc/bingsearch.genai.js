script({
    title: "bing search",
})

const { webPages } = await retrieval.webSearch("microsoft")
def("RES", webPages, { language: "json" })
