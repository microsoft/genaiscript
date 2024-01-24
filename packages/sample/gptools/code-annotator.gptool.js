gptool({
    title: "Code annotator",
    copilot: true,
    description: "Given a problem desciption and code, write a code review",
    maxTokens: 4000,
    model: "gpt-4-32k",
    categories: ["hello world"],
    system: ["system", "system.annotations"],
    temperature: 0,
})

def(
    "CODE",
    env.files.filter(
        (f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")
    ),
    { lineNumbers: true }
)

$`
You are an EXPORT software developer with deep knowledge of all programming languages.

Your job is to do a code review of CODE and create ANNOTATION with code improvement notice, warning and errors. 
- No more than 5 annotations per code file.
- Consider readability, maintainability, performance, security, and correctness. 
- The code in CODE is written by a novice programmer.

Do your best and will get a large tip. $$$.
`
