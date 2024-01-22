gptool({
    title: "CLI Wrapper generator",
    system: ["system", "system.python", "system.files"]
})

def("DOCS", env.links.filter(f => f.filename.endsWith(".txt")))

$` # CLI Wrapper Generator

You will generate a Python wrapper for the command line interface (CLI) described in DOCS file.

- generate methods for each commands
- emit CLI flags as Python optional method parameters.
- emit type information compatible with PyLance.
- generate comments

`