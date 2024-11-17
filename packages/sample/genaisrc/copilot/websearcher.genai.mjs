const res = await retrieval.webSearch(env.vars.question)
def("QUESTION", env.vars.question)
def("WEB_SEARCH", res)
def("FILE", env.files, { ignoreEmpty: true})

$`Answer QUESTION using WEB_SEARCH and FILE.`