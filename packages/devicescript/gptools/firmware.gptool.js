gptool({
    title: "firmware",
    description: "Compile information about various sources to generate DeviceScript driver.",
    categories: ["devicescript"],
    system: ["system", "system.summary", "system.explanations", "system.files", "system.typescript", "system.summary"],
    model: "gpt-4-32k",
    maxTokens: 16000,
})

def("SPEC", env.file)
def("CODE", env.links.filter(f => f.filename.endsWith(".ts")))
def("README", env.links.filter(f => f.filename.endsWith("README.md")))
def("PSEUDO", env.links.filter(f => f.filename.endsWith(".p.ts")))

$`You are an expert at DeviceScript (https://microsoft.github.io/devicescript), a TypeScript compiler and runtime for embedded devices.
Using the information provided in SPEC, generate a DeviceScript driver for the peripherical.`

$`The PSEUDO file contain information about existing code in the library. Use this in CODE.`

$`Generate a README.md file (with filename starting with 'main${env.file.filename.replace(`.gpspec.md`, '')}') that uses the driver 
and displays meaningful information to the console. Generate the list of sources used to generate the code.`

$`Minimize changes to the existing CODE files.`

$`In CODE, when you encounter a comment starting by "// TODO: ", replace comment with generated code for the TODO comment.`

$`
TypeScript style guidance:
-  Use export keyboard on classes.
-  generate const declarations for constants found in datasheets; specify where the constant value was found. Avoid magic numbers in generated code.
-  always await async functions or functions that return a Promise.
-  Use Buffer (like node.js) instead of Uint8Array
`