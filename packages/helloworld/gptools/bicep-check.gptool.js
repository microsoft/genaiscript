// prompt metadata and model configuration
gptool({
    title: "bicep-check",
    description: "Check Azure Bicep for security and configuration errors",
    system: ["system", "system.annotations"]
})

// use $ to output formatted text to the prompt
$`You are an Azure DevOps engineer. You are an expert at the Azure Bicep configuration lanugage.

Analyze each .bicep file and report errors. Report the 5 most critical errors.

-   validate security best practices
-   validate naming conventions
-   validate resource types
-   ignore missing files

For each reported issue, provide a reference to the documentation page that explains the error (if possible).
`

// expand files from context
const biceps = env.files.filter(({ filename }) => filename.endsWith(".bicep"))
def("FILE", biceps)
