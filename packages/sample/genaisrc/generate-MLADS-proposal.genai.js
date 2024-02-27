script({
    title: "generate an MLADS proposal for a project",
    description: "Generate an MLADS proposal from a project description.",
    categories: ["RAI tools"],
})

def("INFO", env.files.filter((f) => f.filename.endsWith("-info.md")))

const pdfs = env.files.find((f) => f.filename.endsWith("-template.pdf"))
const { file, pages } = await parsers.PDF(pdfs)
def("TEMPLATE", file)

const examplePDF = env.files.find((f) => f.filename.endsWith("-example.pdf"))
const exampleObj = await parsers.PDF(examplePDF)
def("EXAMPLE", exampleObj.file)

const projectPDF = env.files.find((f) => f.filename.endsWith("-project.pdf"))
const projectObj = await parsers.PDF(projectPDF)
def("PROJECT", projectObj.file)

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

**Pay attention to these comments about what reviewers will be looking for in the proposal**

Starting from explaining the problem the project addresses, down into more details about what it does and a bit about how it works. Also, consider explaining terms that are central to understanding this project.

I think the audience will also want to know if this is ready to use, or a tool under development. Who is the intended audience and what do you hope they will do as a result of learning about this? 
 
In Methods, the (human) reviewers will similarly look for a bit more detail about how this works and how it was tested.


Write the draft proposal to the file ${outputName}.`
