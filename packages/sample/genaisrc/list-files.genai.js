script({
    model: "gpt-35-turbo",
    tests: [
        {
            keywords: ".genai.js"
        }
    ]
})

const files = await workspace.findFiles("**/*.genai.js", { readText: false })

$`Select the 3 most interresting files from the list below:

${files.map((f) => f.filename).join("\n")}
`
