script({
    title: "Bicep Best Practices",
    temperature: 0,
})

def("FILE", env.files, { endsWith: ".bicep" })

$`You are an expert at Azure Bicep.

Review the bicep in FILE and generate annotations to enhance the script base on best practices
(https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/best-practices). 

- Generate the top 3 most important annotations.
- Limit range to a single line.
- Do NOT generate notes.
- If a line starts with "#disable-next-line genaiscript", ignore the next line.
`
