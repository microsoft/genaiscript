prompt({
    title: "↓ Generate Tasks",
    replaces: "children",
    system: "system.tasks",
    description: "Generate or update sub tasks based on the summary.",
    categories: ["samples"],
})

$`Split SUMMARY into tasks as STEPS.

This is the syntax:
${env.fence}
${env.subheading} Do something
Description of the something.

${env.subheading} Do something else
Description of something else.
${env.fence}
`

def("SUMMARY", env.fragment)
def("STEPS", env.children)

$`Respond with the new STEPS. Limit changes to existing steps to minimum, but add new steps as needed.`
