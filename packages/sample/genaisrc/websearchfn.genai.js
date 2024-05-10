script({
    title: "Search the web using functions",
    system: ["system", "system.retrieval_web_search"],
})

def("FILES", env.files)

$`Answer the questions in FILES using a web search. 

- List a summary of the answers and the sources used to create the answers.
`
