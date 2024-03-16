script({
    title: "generate impact assessment questions",
    description: "Generate a list of impact assessment questions.",
    group: "RAI tools",
})

def("README", env.files.filter((f) => f.filename.endsWith("README.md")))
def("DIRECTIONS", env.files.filter((f) => f.filename.endsWith("how-to.md")))
def("TEMPLATE", env.files.filter((f) => f.filename.endsWith("template.md")))

//const pdfs = env.files.filter((f) => f.filename.endsWith(".pdf"))
//console.log("pdf files: ", pdfs)

//const { file, pages } = await parsers.PDF(pdfs[0])
//def("PROJECTPDF", file)

const outputName = "assessment-questions.md"

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Your goal is to create a list of impact assessment questions
for understanding the responsible AI implications of the release of a new project.
Use the DIRECTIONS and README and TEMPLATE for guidance in choosing the most
important questions to ask in understanding the potential impact of the project.
Consider possible questions that are not covered in the template but that are 
also very important.  Structure your output into a list of questions drawn from the
template and a second list of questions that are not covered in the template.
Write the questions to the file ${outputName}.`
