script({
    title: "TODOs",
    description: "Try to implement TODOs found in source code.",
    group: "samples",
    system: ["system", "system.files"],
    temperature: 0,
    model: "small",
    tests: {
        files: "src/fib.ts",
        asserts: [{
            type: "javascript",
            transform: "output",
            value: "Object.keys(output.fileEdits).length > 0"
        }]
    }
})

def("CODE", env.files, { lineNumbers: true })

$`In CODE, when you encounter a comment starting by "TODO", 
generate code for the TODO comment in a DIFF format and use the information in SPEC.
Remove implemented TODOs from CODE.
Do not regenerate unmodified files.
`
