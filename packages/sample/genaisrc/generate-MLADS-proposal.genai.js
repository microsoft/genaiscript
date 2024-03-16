script({
    title: "generate an MLADS proposal for a project",
    description: "Generate an MLADS proposal from a project description.",
    group: "RAI tools",
})

def("INFO", env.files, { endsWith: "-info.md" })
def("TEMPLATE", env.files, { endsWith: "-template.pdf" })
def("EXAMPLE", env.files, { endsWith: "-example.pdf" })
def("PROJECT", env.files, { endsWith: "-project.pdf" })

const outputName = path.join(path.dirname(env.spec.filename), "MLADS-draft.md")

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
**Write the proposal as a series of paragraphs and not a list of questions and answers.**

**Pay attention to these comments about what reviewers will be looking for in the proposal**

Starting from explaining the problem the project addresses, 
down into more details about what it does and a bit about how it works. 
Explain terms that are central to understanding this project.

Make sure the reader knows if this is ready to use or a tool under development. 
Identify the intended audience and what do you hope they will do as a result of 
learning about the project?  
In the Methods section, a reviewer will similarly look for more detail about how 
this works and how it was tested.
Write the draft proposal to the file ${outputName}.`
