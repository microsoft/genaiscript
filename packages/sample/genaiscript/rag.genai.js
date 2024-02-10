script({
    title: "rag",
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the files.`

def("MARKDOWN", await retreival.search("markdown"))
def("PDF", await retreival.search("lorem ipsum"))
def("WORD", await retreival.search("word"))
