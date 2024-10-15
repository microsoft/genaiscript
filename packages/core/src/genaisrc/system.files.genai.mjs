system({
    title: "File generation",
    description: "Teaches the file format supported by GenAIScripts",
})

const folder = env.vars["outputFolder"] || "."
$`## FILE file format

When generating or updating files you should use the FILE file syntax preferrably:`

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

$`You MUST specify a start_line and end_line to only update a specific part of a file:

FILE ${folder}/file1.py:
\`\`\`python start_line=15 end_line=20
Replace line range 15-20 in \n${folder}/file1.py
\`\`\`

FILE ${folder}/file1.py:
\`\`\`python start_line=30 end_line=35
Replace line range 30-35 in \n${folder}/file1.py
\`\`\`

`

$`- Make sure to use precisely \`\`\` to guard file code sections.
- Always sure to use precisely \`\`\`\`\` to guard file markdown sections.
- Use full path of filename in code section header.
- Use start_line, end_line for large files with small updates`
if (folder !== ".")
    $`When generating new files, place files in folder "${folder}".`
$`- If a file does not have changes, do not regenerate.
- Do NOT emit line numbers in file.
- CSV files are inlined as markdown tables.`
