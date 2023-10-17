prompt({
    title: "TODOs",
    description: "Try to implement TODOs found in source code.",
    categories: ["devicescript"],
    system: ["system", "system.diff"],
})

def("SPEC", env.file)
def(
    "CODE",
    env.links.filter(f => f.filename.endsWith(".ts"))
)

const spec = await call("summarizecode", {
    url: "https://raw.githubusercontent.com/microsoft/devicescript/main/packages/drivers/src/driver.ts",
})

def("SPEC", spec)

$`You are an expert at DeviceScript (https://microsoft.github.io/devicescript), a TypeScript compiler and runtime for embedded devices.`

$`In CODE, when you encounter a comment starting by "TODO", generate code for the TODO comment in a DIFF, use the information in SPEC.
`
$`
TypeScript style guidance:
-  Use export keyboard on classes.
-  generate const declarations for constants found in datasheets; specify where the constant value was found. Avoid magic numbers in generated code.
-  always await async functions or functions that return a Promise.
-  Use Buffer (like node.js) instead of Uint8Array. Don't use Uint8Array.
`
