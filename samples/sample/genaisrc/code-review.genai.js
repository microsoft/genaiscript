script({
    title: "Code review",
    description: "Given a problem desciption and code, write a code review",
    maxTokens: 4000,
    group: "samples",
    temperature: 0,
})

// content
const spec = env.files.find((f) => f.filename.endsWith(".md"))
def("SPEC", spec)
def(
    "CODE",
    env.files.filter(
        (f) =>
            path.extname(f.filename) === ".py" &&
            !path.basename(f.filename).startsWith("test_")
    )
)

// workspace
const file = await workspace.readText("README.md")
def("README", file)

// prompt generation
$`
You are an expert software developer with deep knowledge of the Python programming language.  
You have been asked to review the code in CODE and provide a code review.  
The code in CODE is intended to solve the problem described in SPEC (ignore the existing Code Review section).  
The code in CODE is written by a novice programmer.  
Your job is to critique the code and create a list ways in which it could be improved.
Use context from README to help you understand the problem and the code.
`

$`Replace the entire "Code Review" section in the SPEC ${spec.filename} file 
with your code review. Do not generate python or modify python files. Do not modify file names.
`
