script({
    title: "grep search",
    model: "gpt-3.5-turbo",
    tests: {},    
})

const kw = env.vars.keyword || "defdata"
const files = await workspace.grep(kw, "**/*.genai.{js,mjs}")
def("FILE", files, { maxTokens: 1000 })
$`Use the information in FILE and generate a documentation page
for '${kw}' in './${kw}.md'.`
