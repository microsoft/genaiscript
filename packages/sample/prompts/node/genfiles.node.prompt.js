prompt({
    title: "Generate Node.js Code (multifile)",
    system: ["system.code", "system.concise", "system.multifile"],
    temperature: 0.01,
    categories: ["code.js.node"],
})

$`You are an expert system designer that writes node.js code.`

$`Generate code for all files mentioned in SPECS below.`

def("SPECS", env.subtree)

$`Generate plain node.js ESM syntax, do not generate markdown.`
