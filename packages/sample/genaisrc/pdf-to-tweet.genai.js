script({
    model: "openai:gpt-3.5-turbo",
    title: "generate a tweet from a pdf file",    
    tests: {
        files: "src/rag/loremipsum.pdf",
        keywords: "lorem"
    }
})

def("DOCS", env.files) // contains some pdfs

$`Given the paper in DOCS, generate a 140 character tweet that
captures the paper idea and make it interesting.`