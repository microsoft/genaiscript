script({
    title: "rag",
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the files.`

def("MARKDOWN", await retreive("markdown", env.files))
def("PDF", await retreive("lorem ipsum", env.files))
def("WORD", await retreive("word", env.files))
