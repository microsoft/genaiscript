script({
    title: "Generate Node.js Code (multifile)",
    temperature: 0.01,
    group: "code.js.node",
})

$`You are an expert system designer that writes node.js code.`

$`Generate code for all files mentioned in SPECS below.`

def("SPECS", env.files)

$`Generate plain node.js ESM syntax, do not generate markdown.`
