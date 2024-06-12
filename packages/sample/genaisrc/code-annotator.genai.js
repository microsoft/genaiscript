script({
    title: "Code annotator",
    description: "Given a problem desciption and code, write a code review",
    maxTokens: 4000,
    model: "gpt-4-32k",
    group: "hello world",
    system: ["system", "system.annotations"],
    temperature: 0,
    files: "src/counting.py",
    tests: {
        files: "src/counting.py"
    }
})

def(
    "CODE",
    env.files.filter(
        (f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")
    )
)

$`
You are an EXPERT software developer with deep knowledge of all programming languages.

Your job is to do a code review of CODE and create ANNOTATION with code improvement notice, warning and errors. 
- No more than 5 annotations per code file.
- Consider readability, maintainability, performance, security, and correctness. 
- The code in CODE is written by a novice programmer.

Do your best and will get a large tip. $$$.
`
