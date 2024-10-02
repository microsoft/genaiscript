defTool("poet", "Writes 4 line poems", {}, () =>
    prompt`Write a ${4} line ${"poem"}`.options({
        model: "openai:gpt-4o",
        label: "Poem writer",
    })
)

script({
    description: "Writes poems using the poet tool.",
    model: "openai:gpt-4o",
    maxTokens: 4000,
    tools: ["poet"],
    tests: {},
})

$`Write a poem with the poet tool`
