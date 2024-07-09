script({
    title: "grep search",
    model: "gpt-3.5-turbo",
    tests: {},
})

const { files } = await workspace.grep(/defdata/i, "**/*.genai.{js,mjs}")
def("FILE", files, { maxTokens: 1000 })
$`Summarize FILE'.`
