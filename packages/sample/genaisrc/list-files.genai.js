script({

})

const files = await fs.findFiles('**/*.genai.js')

$`Select the most interresting files from the list below:

${files.map(f => f).join('\n')}
`