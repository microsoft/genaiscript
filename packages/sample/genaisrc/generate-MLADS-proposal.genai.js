script({
    title: "generate an MLADS proposal for a project",
    description: "Generate an MLADS proposal from a project description.",
    categories: ["RAI tools"],
})

const pdfs = env.files.filter((f) => f.filename.endsWith("MLADS-template.pdf"))
console.log("pdf files: ", pdfs)

const { file, pages } = await parsers.PDF(pdfs[0])

const outputName = "MLADS-draft.md"

def("TEMPLATE", file.content)

def("PROJECT", env.files.filter((f) => f.filename.endsWith("transparency-note.md")))

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Your goal is to generate a submission for the MLADS conference 
based on the project documentation in PROJECT. Use the TEMPLATE for guidance in 
writing the proposal.

**Focus on creating a talk submission**.
Respond to all the questions in the TEMPLATE related to Talks.

Write the draft proposal to the file ${outputName}.`
