prompt({
    title: "Generate Python Code",
    system: ["system.code"],
    temperature: 0.01,
    categories: ["code.python"],
})

const pythonFileName = env.file?.filename?.replace(".coarch.md", ".coarch.py")
const python = env.links.find(lk => lk.filename === pythonFileName)

$`
You are an expert system designer that writes Python code.
`

def("SUMMARY", env.file)
if (python) {
    $`Update the following CODE to match SUMMARY. Limit changes to existing code to minimum.`
    def("CODE", python)
}
else
    $`Generate python code to match SUMMARY. Save the generated python in the ${pythonFileName} file.`
