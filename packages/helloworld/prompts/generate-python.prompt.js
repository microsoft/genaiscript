prompt({
    title: "Generate python code",
    output: ".py",
    replaces: "nothing",
    model: "gpt-4-32k",
    description: "Given a task, generate python code.",
    categories: ["tutorial"],
})

def("CODE", env.output)
def("TASK", env.children)

$`You are an expert python programmer.
Generate python code in CODE for the task in TASK.


If the CODE is already present, ensure that CODE matches the
description in TASK and make minimal changes if it does not.`
