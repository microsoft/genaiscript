prompt({
    title: "firmware",
    description: "Compile information about various sources to generate DeviceScript driver.",
    categories: ["devicescript"]
})

def("SPEC", env.file)

$`You are an expert at DeviceScript (https://microsoft.github.io/devicescript), a TypeScript compiler and runtime for embedded devices.
Using the information provided in SPEC, generate a DeviceScript driver for the peripherical.`

$`The base classes for I2C drivers are at https://github.com/microsoft/devicescript/blob/main/packages/drivers/src/driver.ts .
The symbols are in the '@devicescript/drivers' module.`

$`Generate seperate constants for each magic number and specify where the constant value was found`
$`Generate comments for each function.`
$`In the driver class documention, generate the list of sources used to generate the code.`

$`Generate an example file (with filename starting with 'main${env.file.filename.replace(`.coarch.md`, '')}') that uses the driver 
and displays meaningful information to the console.`

$`
TypeScript style guidance:
-  Use export keyboard on classes.
`