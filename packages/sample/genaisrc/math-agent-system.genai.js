script({
    title: "math-agent-system",
    description: "A port of https://ts.llamaindex.ai/examples/agent",
    system: ["system.math"],
    parameters: {
        "question": {
            type: "string",
            default: "How much is 5 + 5? then divide by 2?"
        }
    }
})

$`Answer the following arithmetic question:

    ${env.vars.question}

`
