scr  ipt({
    title: "fuzz search",
    model: "small",
    tests: {},
})
const kw = (env.vars.keyword || "defdata") + ""
const allFiles = await workspace.findFiles("**/*.genai.{js,mjs}")
const files = await retrieval.fuzzSearch(kw, allFiles)
def("FILE", files, { maxTokens: 1000 })

$`Use the information in FILE and generate a documentation 
for '${kw}' in '${kw}.md'.`
