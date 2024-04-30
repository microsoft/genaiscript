script({})

const files = await workspace.findFiles("**/*.genai.js", { readText: false })

$`Select the most interresting files from the list below:

${files.map((f) => f).join("\n")}
`
