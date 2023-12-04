gptool({
    title: "Code annotator",
    description: "Given a problem desciption and code, write a code review",
    maxTokens: 4000,
    model: "gpt-4-32k",
    categories: ["hello world"],
    system: ["system", "system.annotations"],
    temperature: 0,
})

def(
    "CODE",
    env.links.filter(
        (f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")
    ),
    { lineNumbers: true }
)

$`
You are an expert software developer with deep knowledge of the Python programming language.  
You have been asked to review the code in CODE and provide a code review.  The code in CODE is written by a novice programmer.

Your job is to critique the code and create ANNOTATION with code improvement notice, warning and errors.
`
