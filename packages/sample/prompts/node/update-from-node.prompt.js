prompt({
    title: "Update summary based on Node.js Code",
    output: ".node.mjs",
    replaces: "fragment",
    prePost: true,
    system: "system.code",
    temperature: 0.01,
    categories: ["code.js.node"],
})

$`You are an expert system designer that writes node.js code.
Update the following SUMMARY to match CODE.`

def("This is what comes before CODE", env.outputPre)
def("This is CODE", env.output)
def("This is what comes after CODE", env.outputPost)

def("This is context before SUMMARY", env.subtreePre)
def("This is SUMMARY", env.subtree)
def("This is what comes after SUMMARY", env.subtreePost)

$`Respond with the new SUMMARY.
Limit changes to minimum.`
