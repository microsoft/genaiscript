script({
    title: "Bicep Best Practices",
    temperature: 0,
})

def("FILES", env.files, { endsWith: ".bicep" })

$`You are an expert at Azure Bicep.

Review the bicep in FILES and generate annotations to enhance the script base on best practices
(https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/best-practices). 

- Generate the top 3 most important annotations.
- Do NOT generate notes.
`
