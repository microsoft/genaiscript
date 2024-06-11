script({ files: "web-app-basic-linux/main.bicep" })
def("FILE", env.files, { endsWith: ".bicep" } )
$`
You are an expert at Azure Bicep and an expert developer.

- Write a 1 sentence short poem about FILE.
- Use best practices to create 1 improvement in FILE. Include document URL. Use annotations format.

Save results in "<filename>.txt" for each file "<filename>" in FILE.
`
