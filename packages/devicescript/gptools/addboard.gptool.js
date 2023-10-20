prompt({
    title: "Add board",
    description: "Updates a DeviceScript board.json generic file with information from the vendor website.",
    categories: ["devicescript"],
})

const guide = await fetchText(`https://raw.githubusercontent.com/microsoft/devicescript/main/website/docs/devices/add-board.mdx`)
def("GUIDE", guide.file)
def("FILE", env.file)
def("BOARDJSON", env.links.filter(f => f.filename.endsWith(".board.json")))

$`You are an expert at configuration new boards for the DeviceScript system. 
You follow the GUIDE for instructions.

The features of the board are listed in the Features section of FILE.
The pinout of the board is listed in the Pinout section of FILE.
The Jacdac services of the board are listed in the Services section of FILE.

Update BOARDJSON. Keep the $schema parameter.
`
