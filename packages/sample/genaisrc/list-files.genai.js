script({

})

const files = await workspace.findFiles('**/*.genai.js')

$`Select the most interresting files from the list below:

${files.map(f => f).join('\n')}
`