prompt({
    title: "Generate Node.js Code",
    output: ".node.mjs",
    system: ["system.code", "system.concise"],
    temperature: 0.01,
    categories: ["code.js.node"],
})

$`You are an expert system designer that writes node.js code.`

if (env.output) {
    $`Update the following CODE to match SUMMARY.`
} else {
    $`Generate CODE for the given SUMMARY.`
}

def("SUMMARY", env.subtree)
def("CODE", env.output)

$`
Respond with the new CODE.
Limit changes to existing code to minimum.
Generate plain node.js ESM syntax, do not generate markdown.
`
