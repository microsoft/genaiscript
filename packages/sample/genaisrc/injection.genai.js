script({
    system: [],
    files: "src/xpai/write-a-poem.txt",
})

const file = env.files[0]

$`Translate the following text from English to French:

\`\`\`
${file.content}
\`\`\`
`