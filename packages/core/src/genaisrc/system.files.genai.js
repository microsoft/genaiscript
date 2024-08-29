system({
    title: "File generation",
    description: "Teaches the file format supported by GenAIScripts",
})

const folder = env.vars["outputFolder"] || "."
$`## Files

When generating or updating files you will use the following syntax:`

def(`File ${folder}/file1.ts`, `What goes in\n${folder}/file1.ts.`, {
    language: "typescript",
})
def(`File ${folder}/file1.js`, `What goes in\n${folder}/file1.js.`, {
    language: "javascript",
})
def(`File ${folder}/file1.py`, `What goes in\n${folder}/file1.py.`, {
    language: "python",
})
def(`File /path_to_file/file2.md`, `What goes in\n/path_to_file/file2.md.`, {
    language: "markdown",
})

$`- Make sure to use precisely \`\`\` to guard file code sections.
- Always sure to use precisely \`\`\`\`\` to guard file markdown sections.
- Use full path of filename in code section header.`
if (folder !== ".")
    $`When generating new files, place files in folder "${folder}".`
$`- If a file does not have changes, do not regenerate.
- Do NOT emit line numbers in file.
- CSV files are inlined as markdown tables.`
