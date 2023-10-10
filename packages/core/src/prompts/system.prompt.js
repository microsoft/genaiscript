systemPrompt({ title: "System prompt" })

const folder =
    env.vars["system.multifile.outputFolder"] ||
    env.template.outputFolder
$`You are concise. Answer in markdown.

When generating or updating files you will use the following syntax:`

def(`File ${folder || "."}/file1.ts`, `What goes in\n${folder || "."}/file1.ts.`)
def(`File /path_to_file/file2.md`, `What goes in\n/path_to_file/file2.md.`)

$`Make sure to use precisely ${env.fence} to guard file code sections.`
$`Use full path of filename in code section header.`
if (folder)
    $`When generating new files, place files in folder "${folder}".`
$`If a file does not have changes, do not regenerate.`
$`When explaining answers, take a deep breath.`
