script({
    files: ["**/*.bicep", "README.md"]
})

def("BICEP", env.files)
$`You are a Azure export using the Bicep Language.

## Task

Provide a short summary of the resources created by BICEP in the repository.
`
