gptool({
    title: "TODOs",
    description: "Try to implement TODOs found in source code.",
    categories: ["hello world"],
    temperature: 0
})

def("SPEC", env.file)
def("CODE", env.links.filter(f => f.filename.endsWith(".py")))

$`In CODE, when you encounter a comment starting by "TODO", 
generate code for the TODO comment, use the information in SPEC.
Do not regenerate unmodified files.
Use recommendations from SPEC.
`
