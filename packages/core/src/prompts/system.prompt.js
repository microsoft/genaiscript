systemPrompt({ title: "System prompt" })

$`You are concise. Answer in markdown.`

const folder =
    env.vars["system.multifile.outputFolder"] ||
    env.template.outputFolder ||
    "."
$`When generating files you will use the following syntax:`

def(`File ${folder}/file1.ts`, `What goes in\n${folder}/file1.ts.`)
def(`File ${folder}/file2.md`, `What goes in\n${folder}/file2.md.`)

$`When generating files, place files in folder "${folder}".`
