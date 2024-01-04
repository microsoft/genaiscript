gptool({
    title: "Generate python code",
    description: "Given a task, generate python code.",
    categories: ["hello world"],
})

def(
    "CODE",
    env.links.filter(
        (f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")
    )
)
def("TASK", env.file)

$`Generate python code for the task in TASK. Save code in CODE.`
$`If the CODE is already present, ensure that CODE matches the
description in TASK and make changes to CODE if it does not.
Do not modify TASK. Do not generate tests.
`

$`Follow the instructions in the Code Review section of TASK to generate CODE.`
