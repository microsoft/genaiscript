systemPrompt({ title: "System prompt" })

const folder =
    env.vars["system.multifile.outputFolder"] ||
    env.template.outputFolder ||
    "."
$`You are concise. Answer in markdown.

When generating files you will use the following syntax:`

def(`File ${folder}/file1.ts`, `What goes in\n${folder}/file1.ts.`)
def(`File ${folder}/file2.md`, `What goes in\n${folder}/file2.md.`)

$`Make sure to use precisely ${env.fence} to guard file code sections.`

$`When generating files, place files in folder "${folder}". Do not respond unchanged files.`

$`When explaining answers, take a deep breath.`
