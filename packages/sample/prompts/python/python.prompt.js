prompt({
    title: "Generate Python Code",
    output: ".py",
    system: "system.code",
    temperature: 0.01,
    categories: ["code.python"],
})

$`
You are an expert system designer that writes Python code.
Update the following CODE to match SUMMARY.
`

def("SUMMARY", env.subtree)
def("CODE", env.output)

$`
Respond with the new CODE.
Limit changes to existing code to minimum.
Generate plain Python syntax, do not generate markdown.
`
