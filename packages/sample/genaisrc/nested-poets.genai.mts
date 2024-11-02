defTool("poet", "Writes 4 line poems", {}, () =>
    prompt`Write a ${4} line ${"poem"}`.options({
        model: "large",
        label: "Poem writer",
    })
)

script({
    description: "Writes poems using the poet tool.",
    model: "large",
    maxTokens: 4000,
    tools: ["poet"],
    tests: {},
})

$`Write a poem with the poet tool`
