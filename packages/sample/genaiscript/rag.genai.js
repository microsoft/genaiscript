script({
    title: "rag",
})

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the files.`
def("MARKDOWN", (await retreival.search("markdown")).files)
def("PDF", (await retreival.search("lorem ipsum")).files)
def("WORD", (await retreival.search("word")).files)
