script({
    title: "bing search",
})

const { webPages } = await retreival.webSearch("microsoft")
def("RES", webPages, { language: "json" })
