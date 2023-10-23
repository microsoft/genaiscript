gptool({
    title: "Add Comments",
    description: "Review each chapter and adds a comment as a technical reviewer",
    maxTokens: 4000
})

const output = env.file.filename + ".comments.md"
def("FILE", env.file)

$`You are an expert Technical documentation reviewer and you will
create a list of comments about the document FILE. Address any issues
around spelling, grammar, clarity, and completeness. Explain your answers.`

$`Update your comments in ${output} in markdown in 
a pseudo diff format as follows:`

$`- comment description
\`\`\`diff
2 or more lines before the section
- lines to change
+ lines to add
2 or more lines after the section
\`\`\`
`