prompt({
    title: "Code review",
    description: "Given a problem desciption and code, write a code review",
    maxTokens: 4000,
    model: "gpt-4",
    categories: ["tutorial"],
    autoApplyEdits: true,
    nextTemplateAfterApplyEdits: "generate-python",
    readClipboard: true,
    system: ["system", "system.explanations", "system.summary", "system.files"],
    temperature: 0
})

def("SPEC", env.file)
def("CODE", env.links.filter((f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")))
if (env.clipboard)
    def("CLIPBOARD", env.clipboard)

$`
You are an expert software developer with deep knowledge of the Python programming language.  
You have been asked to review the code in CODE and provide a code review.  
The code in CODE is intended to solve the problem described in SPEC (ignore the existing Code Review section).  
The code in CODE is written by a novice programmer.  
Your job is to critique the code and create a list ways in which it could be improved.`
if (env.clipboard)
    $`Analyze CLIPBOARD for runtime errors and suggest code fixes.`

$`Replace the entire "Code Review" section in the SPEC ${env.file.filename} file 
with your code review. Do not generate python or modify python files. Do not modify file names.
`
