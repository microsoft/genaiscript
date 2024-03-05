script({
    title: "bing search"
})

const res = await retreival.webSearch("microsoft")
def("RES", JSON.stringify(res), { language: "json"})