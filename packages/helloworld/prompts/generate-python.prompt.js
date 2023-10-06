prompt({
    title: "Generate python code",
    model: "gpt-4",
    description: "Given a task, generate python code.",
    system: ["system.code", "system.summary"],
    categories: ["tutorial"],
})

def("CODE", env.links.filter(
    (f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")
))
def("TASK", env.file)

$`You are an expert python programmer.
Generate python code in CODE for the task in TASK.
 
If the CODE is already present, ensure that CODE matches the
description in TASK and make minimal changes if it does not.`
