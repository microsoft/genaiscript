script({
    model: "small",
    tests: {
        keywords: ".genai.js",
    },
})

const files = await workspace.findFiles("**/*.genai.{js,mjs}", { readText: false })

$`Select the 3 most interesting files from the list below:

${files.map((f) => f.filename).join("\n")}
`
