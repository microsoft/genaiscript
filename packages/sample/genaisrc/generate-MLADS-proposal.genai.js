script({
    title: "generate an MLADS proposal for a project",
    description: "Generate an MLADS proposal from a project description.",
    categories: ["RAI tools"],
})

def("INFO", env.files.filter((f) => f.filename.endsWith("-info.md")))

const pdfs = env.files.filter((f) => f.filename.endsWith("-template.pdf"))
const { file, pages } = await parsers.PDF(pdfs[0])
def("TEMPLATE", file.content)

const examplePDF = env.files.filter((f) => f.filename.endsWith("-example.pdf"))
const exampleObj = await parsers.PDF(examplePDF[0])
def("EXAMPLE", exampleObj.file.content)

const projectPDF = env.files.filter((f) => f.filename.endsWith("-project.pdf"))
const projectObj = await parsers.PDF(projectPDF[0])
def("PROJECT", projectObj.file.content)

const outputName = "MLADS-draft.md"


// use $ to output formatted text to the prompt
$`You are a helpful assistant. Your goal is to generate a submission for the MLADS conference 
based on the project documentation in PROJECT.  Use general information about MLADS from
INFO to understand the audience and goals of the conference and proposal.

Use the TEMPLATE for guidance in writing the proposal.  

**Generate a talk submission**.
Respond to all the questions in the TEMPLATE related to Talks.
Use EXAMPLE as an example of the final output except that the format of the output should be markdown.
**Be sure to make the proposal as specific and detailed as EXAMPLE.**
**Make sure the format of the output is markdown.**

Write the draft proposal to the file ${outputName}.`
