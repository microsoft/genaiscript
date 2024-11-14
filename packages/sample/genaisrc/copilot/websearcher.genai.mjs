const res = await retrieval.webSearch(env.vars.question)
def("WEB_SEARCH", res)
def("FILE", env.files, { ignoreEmpty: true})

$`Summarize the content of WEB_SEARCH and use the content of FILE to ground your answer.`