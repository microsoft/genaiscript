script({
    model: "gpt-3.5-turbo",
    temperature: 0,
    files: "web-app-basic-linux/main.bicep",
    system: [
        "system",
        "system.explanations",
        "system.files",
        "system.annotations",
    ],
    tools: ["fs_find_files", "fs_read_file"],
})
def("BICEP", env.files)
$`You are a Azure export using the Bicep Language.`

$`Use best practices to reports annotations for the BICEP file.

- only report errors
- use annotations format
- use file full names

## Module resolution

If you find code like

    module createNic1 './nic.bicep'

then the read the file content of the file nic.bicep and report any errors in that file.
`
