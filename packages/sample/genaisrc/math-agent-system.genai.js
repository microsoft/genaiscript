script({
    title: "math-agent-system",
    description: "A port of https://ts.llamaindex.ai/examples/agent",
    system: ["system", "system.explanations", "system.files", "system.technical", "system.math"],
})

$`How much is 5 + 5? then divide by 2?`