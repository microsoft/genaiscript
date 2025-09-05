script({
    title: "math-agent-system",
    model: "small",
    description: "A port of https://ts.llamaindex.ai/examples/agent",
    system: ["system", "system.math", "system.tools"],
    parameters: {
        "question": {
            type: "string",
            default: "How much is (11 + 4 / 9.11)? then divide by 3.13?"
        }
    },
    tests: {
        description: "Testing the default prompt",
        keywords: "5"
    }
})

$`Respond this math question:

    ${env.vars.question}

- do not generate python code
- print the final result in text format
`
