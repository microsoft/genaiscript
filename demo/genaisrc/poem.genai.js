script({ 
    model: "azure:gpt2networkverification",
    files: "web-app-basic-linux/main.bicep" })
def("FILE", env.files, { endsWith: ".bicep" } )
$`
- Write a 1 sentence short poem about FILE.
- Use best practices to create 1 improvement in FILE. Include document URL. Use annotations format.

Save results in "<filename>.txt" for each file "<filename>" in FILE.
`
