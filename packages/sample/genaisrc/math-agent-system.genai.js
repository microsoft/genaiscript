script({
    title: "math-agent-system",
    model: "openai:gpt-3.5-turbo",
    description: "A port of https://ts.llamaindex.ai/examples/agent",
    system: ["system.math"],
    parameters: {
        "question": {
            type: "string",
            default: "How much is 11 + 4? then divide by 3?"
        }
    },
    tests: {
        description: "Testing the default prompt",
        keywords: "5"
    }
})

$`Answer the following arithmetic question:

    ${env.vars.question}

`
