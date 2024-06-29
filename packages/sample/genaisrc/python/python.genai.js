script({
    title: "Generate Python Code",
    temperature: 0.01,
    group: "code.python",
})
const spec = env.files.find((f) => f.filename.endsWith(".gpspec.md"))
const pythonFileName = spec.filename.replace(".gpspec.md", ".genai.py")
const python = env.files.find((lk) => lk.filename === pythonFileName)

$`
You are an expert system designer that writes Python code.
`

def("SUMMARY", spec)
if (python) {
    $`Update the following CODE to match SUMMARY. Limit changes to existing code to minimum.`
    def("CODE", python)
} else
    $`Generate python code to match SUMMARY. Save the generated python in the ${pythonFileName} file.`
