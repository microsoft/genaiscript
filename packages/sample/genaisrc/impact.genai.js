script({
    title: "generate impact assessment",
    description: "Generate an impact assessment for a given project.",
})

def("README", env.files.filter((f) => f.filename.endsWith("README.md")))
def("DIRECTIONS", env.files.filter((f) => f.filename.endsWith("how-to.md")))
def("TEMPLATE", env.files.filter((f) => f.filename.endsWith("template.md")))

const fname = env.files.filter((f) => f.filename.endsWith(".pdf"))
console.log("pdf files: ", fname)


const { file, pages } = await parsers.PDF(env.files.filter((f) => f.filename.endsWith(".pdf"))[0])

def("PROJECTPDF", file)

const outputName = "assessment-draft.md"

// use $ to output formatted text to the prompt
$`You are a helpful assistant. Your goal is to write a draft impact assessment for the project.
Which is documented in PROJECTPDF.
Use the DIRECTIONS and README for guidance in writing the assessment.
**Be sure** that the draft assessment follows the structure and questions in TEMPLATE.
Write the draft assessment to the file ${outputName}.`
