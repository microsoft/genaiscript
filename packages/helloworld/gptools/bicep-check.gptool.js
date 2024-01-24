// prompt metadata and model configuration
gptool({
    title: "bicep-check",
    description: "Check Azure Bicep for security and configuration errors",
    system: ["system", "system.annotations"]
})

// use $ to output formatted text to the prompt
$`You are an expert Azure DevOps engineer. You are an expert at the Azure Bicep configuration language.

Analyze each .bicep FILE and report errors. Report the 5 most critical errors.

-   validate security best practices
-   validate naming conventions
-   validate resource types
-   ignore missing files

`

// expand files from `env` content
const biceps = env.files.filter(({ filename }) => filename.endsWith(".bicep"))

// define LLM variables
def("FILE", biceps)
