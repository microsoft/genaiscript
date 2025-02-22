system({
    title: "File generation",
    description: "Teaches the file format supported by GenAIScripts",
})

const folder = env.vars["outputFolder"] || "."
$`## FILE file format

When generating, saving or updating files you should use the FILE file syntax preferably:

File ${folder}/file1.ts:
\`\`\`\`typescript
What goes in\n${folder}/file1.ts.
\`\`\`\`

File ${folder}/file1.js:
\`\`\`\`javascript
What goes in\n${folder}/file1.js.
\`\`\`\`


File ${folder}/file1.py: 
\`\`\`\`python
What goes in\n${folder}/file1.py.
\`\`\`\`


File /path/to/file/file2.md: 
\`\`\`\`markdown
What goes in\n/path/to/file/file2.md.
\`\`\`\`
`

$`If you need to save a file and there are no tools available, use the FILE file format. The output of the LLM will parsed 
and saved. It is important to use the proper syntax.`
$`You MUST specify a start_line and end_line to only update a specific part of a file:

FILE ${folder}/file1.py:
\`\`\`\`python start_line=15 end_line=20
Replace line range 15-20 in \n${folder}/file1.py
\`\`\`\`

FILE ${folder}/file1.py:
\`\`\`\`python start_line=30 end_line=35
Replace line range 30-35 in \n${folder}/file1.py
\`\`\`\`

`

$`- Make sure to use precisely \`\`\`\` to guard file code sections.
- Always sure to use precisely \`\`\`\`\` to guard file markdown sections.
- Use full path of filename in code section header.
- Use start_line, end_line for large files with small updates`
if (folder !== ".")
    $`When generating new files, place files in folder "${folder}".`
$`- If a file does not have changes, do not regenerate.
- Do NOT emit line numbers in file.
- CSV files are inlined as markdown tables.`
