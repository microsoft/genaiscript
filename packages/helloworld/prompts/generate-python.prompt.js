prompt({
    title: "Generate python code",
    model: "gpt-4",
    description: "Given a task, generate python code.",
    categories: ["tutorial"],
    system: ["system", "system.explanations", "system.summary", "system.files"],
    temperature: 0
})

def("CODE", env.links.filter(
    (f) => f.filename.endsWith(".py") && !f.filename.startsWith("test_")
))
def("TASK", env.file)
if (env.clipboard)
    def("CLIPBOARD", env.clipboard)

$`Generate python code for the task in TASK. Save code in CODE.`
if (env.clipboard)
    $`Analyze CLIPBOARD for runtime errors and fix the code.`
$`If the CODE is already present, ensure that CODE matches the
description in TASK and make minimal changes to CODE if it does not.`
