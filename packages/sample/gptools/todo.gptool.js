gptool({
    title: "TODOs",
    description: "Try to implement TODOs found in source code.",
    categories: ["samples"],
    system: ["system", "system.diff"],
    temperature: 0,
})

def("SPEC", env.spec)
def("CODE", env.files, { lineNumbers: true })

$`In CODE, when you encounter a comment starting by "TODO", 
generate code for the TODO comment in a DIFF format and use the information in SPEC.
Remove implemented TODOs from CODE.
Use recommendations from SPEC.
Do not regenerate unmodified files.
`
