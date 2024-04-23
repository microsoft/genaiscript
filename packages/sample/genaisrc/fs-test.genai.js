script({
    title: "fs test",
})

def("PDF", await fs.readText(env.files.find(f => f.filename.endsWith(".pdf"))))
def("DOCX", await fs.readText(env.files.find(f => f.filename.endsWith(".docx"))))
def("MD", await fs.readText(env.files.find(f => f.filename.endsWith(".md"))))

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Summarize the PDF and DOCX files.`
