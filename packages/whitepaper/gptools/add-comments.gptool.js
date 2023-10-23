gptool({
    title: "Add Comments",
    description: "Review each chapter and adds a comment as a technical reviewer",
    maxTokens: 4000,
    system: ["system", "system.diff"]
})

const output = env.file.filename + ".comments.md"
def("FILE", env.file)

$`You are an expert Technical documentation reviewer and you will
create a list of comments about the document FILE. Address any issues
around spelling, grammar, clarity, and completeness in FILE. Explain your answers. Only add comments if they required a change in FILE`

$`Generate your comments in markdown using 
a pseudo diff format as follows:`

$`- summary and reason of the change (don't emit "summary:")
\`\`\`diff
2 or more lines before the section
- current lines to change
+ new lines to add
2 or more lines after the section
\`\`\`
`