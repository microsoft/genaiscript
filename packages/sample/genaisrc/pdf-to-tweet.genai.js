script({
    title: "generate a tweet from a pdf file"
})

def("DOCS", env.files) // contains some pdfs

$`Given the paper in DOCS, generate a 140 character tweet that
captures the paper idea and make it interesting.`