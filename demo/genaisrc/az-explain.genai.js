script({
    model: "gpt-3.5-turbo",
    temperature: 0,
    files: "web-app-basic-linux/main.bicep",
})
def("BICEP", env.files)
$`You are a Azure export using the Bicep Language.`

$`Use best practices to reports annotations for the BICEP file.

- only report errors
`
