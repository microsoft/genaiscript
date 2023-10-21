gptool({
    title: "Add board",
    description: "Updates a DeviceScript board.json generic file with information from the vendor website.",
    categories: ["devicescript"],
    model: "gpt-4-32k",
    maxTokens: 20000,
    temperature: 0
})

const schema = await fetchText(`https://raw.githubusercontent.com/microsoft/devicescript/main/website/docs/devices/boards.json`)
def("SCHEMA", schema.file)
const guide = await fetchText(`https://raw.githubusercontent.com/microsoft/devicescript/main/website/docs/devices/add-board.mdx`)
def("GUIDE", guide.file)
def("FILE", env.file)
//def("BOARDJSON", env.links.filter(f => f.filename.endsWith(".board.json")))

$`You are an expert at configuration new boards for the DeviceScript system. 
You follow the GUIDE for instructions.

The features of the board are listed in the Features section of FILE.
The pinout of the board is listed in the Pinout section of FILE. Ignore GND and 3V3 pins. If a pin is used in a service, do NOT list in the pins section.
The Jacdac services of the board are listed in the Services section of FILE.

The file name of BOARDJSON must end with ".board.json".

The JSON schema of BOARDJSON is SCHEMA at https://raw.githubusercontent.com/microsoft/devicescript/main/website/docs/devices/boards.json.

Generate BOARDJSON according to the instructions above using the JSON schema SCHEMA. Add the $schema attribute.
`
