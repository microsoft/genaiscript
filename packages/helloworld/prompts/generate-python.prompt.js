prompt({
    title: "Generate python code",
    model: "gpt-4",
    description: "Given a task, generate python code.",
    categories: ["tutorial"],
})

def("CODE", env.links.filter(
    (f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")
))
def("TASK", env.file)
def("CLIPBOARD", env.clipboard)

$`You are an expert python programmer.
Generate python code in CODE for the task in TASK.

If CLIPBOARD is present, analyze it for runtime errors and fix the code.
 
If the CODE is already present, ensure that CODE matches the
description in TASK and make minimal changes if it does not.`
