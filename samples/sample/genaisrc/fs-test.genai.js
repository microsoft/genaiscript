script({
    title: "fs test",
})

def("PDF", await workspace.readText(env.files.find(f => f.filename.endsWith(".pdf"))))
def("DOCX", await workspace.readText(env.files.find(f => f.filename.endsWith(".docx"))))
def("MD", await workspace.readText(env.files.find(f => f.filename.endsWith(".md"))))

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the PDF and DOCX files.`
