script({
    title: "fuzz search",
    model: "gpt-3.5-turbo",
    tests: {},
})

const kw = env.vars.keyword || "defdata"
const allFiles = await workspace.findFiles("**/*.genai.{js,mjs}")
const files = await retrieval.fuzzSearch(kw, allFiles)
def("FILE", files, { maxTokens: 1000 })

$`Use the information in FILE and generate a documentation 
for '${kw}' in '${kw}.md'.`
