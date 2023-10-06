prompt({
    title: "Code review",
    description: "Given a problem desciption and code, write a code review",
    maxTokens: 4000,
    model: "gpt-4",
    categories: ["tutorial"],
    system: ["system.summary"],
    autoApplyEdits: true
})

def("SPEC", env.file)
def("CODE", env.links.filter((f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")))

$`
You are an expert software developer with deep knowledge of the Python programming language.  
You have been asked to review the code in CODE and provide a code review.  
The code in CODE is intended to solve the problem described in SPEC.  
The code in CODE is written by a novice programmer.  
Your job is to critique the code and create a list ways in which it could be improved.

Replace the "Code Review" section in the SPEC ${env.file.filename} file with your code review. Do not modify CODE.
`
