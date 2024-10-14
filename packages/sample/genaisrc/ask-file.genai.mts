script({
    model: "openai:gpt-4o",
    tools: ["fs"],
})

$`- Compare JSON and bicep templates as described in src/azure-lza/azure-azure-resource-manager-bicep.pdf
- Summarize findings`
