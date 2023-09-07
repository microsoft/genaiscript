prompt({
    title: "Update Node.js Code",
    output: ".node.mjs",
    prePost: true,
    system: "system.code",
    temperature: 0.01,
    categories: ["code.js.node"],
})

$`
You are an expert system designer that writes node.js code.
Update the following CODE to match SUMMARY.
`

def("This is what comes before CODE", env.outputPre)
def("This is CODE", env.output)
def("This is what comes after CODE", env.outputPost)

def("This is context before SUMMARY", env.subtreePre)
def("This is SUMMARY", env.subtree)
def("This is what comes after SUMMARY", env.subtreePost)

$`
Respond with the new CODE.
Limit changes to existing code to minimum.
Generate plain node.js ESM syntax, do not generate markdown.
`
