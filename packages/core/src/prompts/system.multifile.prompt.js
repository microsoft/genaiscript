systemPrompt({ title: "Setup for multi-file generation" })

$`When generating files you will use the following syntax:`

const folder = env.template.outputFolder || "."
def(`File ${folder}/file1.ts`, `What goes in\n${folder}/file1.ts.`)
def(`File ${folder}/file2.md`, `What goes in\n${folder}/file2.md.`)

$`Generate files in a folder "${folder}".`
