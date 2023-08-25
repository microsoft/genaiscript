systemPrompt({ title: "Setup for multi-file generation" })

$`When generating files you will use the following syntax:`

const id = env.template
def(`File ${id}/file1.ts`, `What goes in\n${id}/file1.ts.`)
def(`File ${id}/file2.md`, `What goes in\n${id}/file2.md.`)

$`Generate files in a folder "${id}".`
